from flask import Flask, jsonify, request
from flask_cors import CORS 

# Imports all business logic functions from your logic.py file.
from logic import visualizar_estoque, adicionar_produto, registrar_venda, excluir_produto

app = Flask(__name__)
# Configure CORS to allow React requests from any origin during development.
CORS(app) 

# --- API ROUTES (ENDPOINTS) ---

# 1. GET Route: List all inventory
# URL: http://127.0.0.1:5000/estoque
@app.route('/estoque', methods=['GET'])
def listar_estoque():
    """Retorna a lista completa de produtos em formato JSON."""
    dados_estoque = visualizar_estoque() 
    return jsonify(dados_estoque) 

# 2. POST Route: Register or Update product (UPSERT logic)
# URL: http://127.0.0.1:5000/estoque/cadastro
@app.route('/estoque/cadastro', methods=['POST'])
def cadastrar_produto_api():
    """Recebe os dados JSON do React e adiciona/atualiza um produto."""
    dados = request.get_json()
    
    # Simple data validation
    if not all(key in dados for key in ['codigo', 'nome', 'preco', 'qtd']):
        # Retorna um erro HTTP 400 (Bad Request)
        return jsonify({"erro": "Dados incompletos: código, nome, preço e qtd são obrigatórios."}), 400
        
    try:
        # Calls the logic function, converting the data types.
        produto_adicionado = adicionar_produto(
            dados['codigo'].strip().upper(),
            dados['nome'],
            # Ensures proper type casting and handles potential empty strings gracefully
            float(str(dados['preco']).replace(',', '.')) if dados['preco'] else 0.0,
            int(dados['qtd']) if dados['qtd'] else 0
        )
        # Returns success with HTTP status 201 (Created).
        return jsonify({"mensagem": "Produto adicionado/atualizado com sucesso!", "produto": produto_adicionado}), 201
    except ValueError:
        return jsonify({"erro": "Preço ou quantidade inválidos. Certifique-se de usar números."}), 400
    except Exception as e:
        # Generic error handler
        return jsonify({"erro": f"Erro inesperado no cadastro: {str(e)}"}), 500


# 3. POST Route: Register Sale/Venda (Matches frontend URL: /estoque/venda)
# URL: http://127.0.0.1:5000/estoque/venda
@app.route('/estoque/venda', methods=['POST'])
def registrar_venda_api():
    """Recebe o código do produto e registra a venda, debitando a quantidade."""
    dados = request.get_json()
    codigo = dados.get('codigo')
    # The frontend sends quantity: 1, so we default to 1 if missing.
    quantidade = dados.get('quantidade', 1) 
    
    if not codigo:
        return jsonify({"erro": "Código não fornecido"}), 400

    try:
        quantidade = int(quantidade)
        if quantidade <= 0:
            return jsonify({"erro": "Quantidade inválida para venda."}), 400

        # Calls its logic function.
        resultado = registrar_venda(codigo.strip().upper(), quantidade)
        
        if resultado['status'] == 'sucesso':
            # Returns success with HTTP status 200.
            return jsonify({"mensagem": resultado['mensagem'], "item": resultado['item']}), 200
        else:
            # Returns a business logic error (e.g., item not found, insufficient stock)
            return jsonify({"erro": resultado['mensagem']}), 400 
    except ValueError:
        return jsonify({"erro": "Quantidade inválida"}), 400
    except Exception as e:
        return jsonify({"erro": f"Erro inesperado na venda: {str(e)}"}), 500


# 4. DELETE Route: Delete Product
# URL: http://127.0.0.1:5000/estoque/excluir
@app.route('/estoque/excluir', methods=['DELETE'])
def excluir_produto_api():
    """Recebe o código do produto e o remove do estoque."""
    dados = request.get_json()
    codigo = dados.get('codigo')
    
    if not codigo:
        return jsonify({"erro": "Código não fornecido"}), 400
        
    # It calls its function logic.
    resultado = excluir_produto(codigo.strip().upper())
    
    if resultado['status'] == 'sucesso':
        # Returns success with HTTP status 200.
        return jsonify({"mensagem": resultado['mensagem']}), 200
    else:
        # Returns an error with HTTP status 404 (Not Found).
        return jsonify({"erro": resultado['mensagem']}), 404
    
    
# --- START THE SERVER ---
if __name__ == '__main__':
    print("Servidor Flask API iniciado na porta 5000...")
    # The debug=True option is great for development, showing errors in the browser.
    app.run(debug=True, port=5000)