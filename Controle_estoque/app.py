from flask import Flask, jsonify, request
from flask_cors import CORS 


# Imports all business logic functions from your logic.py file.
from logic import *

app = Flask(__name__)
# Configure CORS to allow React requests.

CORS(app) 

# --- API ROUTES (ENDPOINTS) ---

# 1. GET Route: List all inventory
# URL: http://127.0.0.1:5000/inventory
@app.route('/estoque', methods=['GET'])
def listar_estoque():
    """Retorna a lista completa de produtos em formato JSON."""
    dados_estoque = visualizar_estoque() 
    return jsonify(dados_estoque) 

# 2. POST Route: Register new product
# URL: http://127.0.0.1:5000/estoque/cadastro
@app.route('/estoque/cadastro', methods=['POST'])
def cadastrar_produto_api():
    """Recebe os dados JSON do React e adiciona um novo produto."""
    dados = request.get_json()
    
    # Simple data validation
    if not all(key in dados for key in ['codigo', 'nome', 'preco', 'qtd']):
        # Retorna um erro HTTP 400 (Bad Request)
        return jsonify({"mensagem": "Dados incompletos"}), 400
        
    # It calls the logic function, converting the data types.
    try:
        produto_adicionado = adicionar_produto(
            dados['codigo'].strip().upper(),
            dados['nome'],
            float(dados['preco']),
            int(dados['qtd'])
        )
        # Returns the added product with HTTP status 201 (Created).
        return jsonify({"mensagem": "Produto adicionado com sucesso!", "produto": produto_adicionado}), 201
    except ValueError:
        return jsonify({"mensagem": "Preço ou quantidade inválidos"}), 400


# 3. POST Route: Register Sale/Departure
# URL: http://127.00.1:5000/estoque/saida
@app.route('/estoque/saida', methods=['POST'])
def registrar_saida_api():
    """Recebe o código do produto e registra a saída (venda)."""
    dados = request.get_json()
    codigo = dados.get('codigo')
    
    if not codigo:
        return jsonify({"mensagem": "Código não fornecido"}), 400

    # It calls its function logic.
    resultado = registrar_saida(codigo.strip().upper())
    
    if resultado['status'] == 'sucesso':
        # Returns success with HTTP status 200.
        return jsonify({"mensagem": "Venda registrada com sucesso!", "item": resultado['item']}), 200
    else:
        # Returns an error with HTTP status 404 (Not Found).
        return jsonify({"mensagem": resultado['mensagem']}), 404
    
# 4. PUT Route: Edit Existing Product
# URL: http://127.0.0.1:5000/estoque/editar
@app.route('/estoque/editar', methods=['PUT'])
def editar_produto_api():
    dados = request.get_json()
    
    if not all(key in dados for key in ['codigo', 'nome', 'preco', 'qtd']):
        return jsonify({"mensagem": "Dados incompletos"}), 400
        
    try:
        resultado = editar_produto(
            dados['codigo'].strip().upper(),
            dados['nome'],
            float(dados['preco']),
            int(dados['qtd'])
        )
        
        if resultado['status'] == 'sucesso':
            return jsonify({"mensagem": "Produto atualizado com sucesso!", "produto": resultado['item']}), 200
        else:
            return jsonify({"mensagem": resultado['mensagem']}), 404
            
    except ValueError:
        return jsonify({"mensagem": "Preço ou quantidade inválidos"}), 400

# 5. DELETE Route: Delete Product
# URL: http://127.0.0.1:5000/estoque/excluir
@app.route('/estoque/excluir', methods=['DELETE'])
def excluir_produto_api():
    dados = request.get_json()
    codigo = dados.get('codigo')
    
    if not codigo:
        return jsonify({"mensagem": "Código não fornecido"}), 400
        
    # It calls its function logic.
    resultado = excluir_produto(codigo.strip().upper())
    
    if resultado['status'] == 'sucesso':
        # Returns success with HTTP status 200.
        return jsonify({"mensagem": resultado['mensagem']}), 200
    else:
        # Returns an error with HTTP status 404 (Not Found).
        return jsonify({"mensagem": resultado['mensagem']}), 404
    
    
# --- START THE SERVER ---
if __name__ == '__main__':
    print("Servidor Flask API iniciado na porta 5000...")
    app.run(debug=True, port=5000)