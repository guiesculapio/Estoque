import json
import os 

# --- Persistência de Dados (JSON File) ---

def carregar_estoque():
    """Tenta carregar o estoque do arquivo JSON. Retorna uma lista vazia em caso de erro ou arquivo não existente."""
    nome_arquivo = 'estoque.json'
    
    if os.path.exists(nome_arquivo) and os.path.getsize(nome_arquivo) > 0:
        try:
            with open(nome_arquivo, 'r') as arquivo:
                # O arquivo JSON guarda uma lista de produtos
                return json.load(arquivo)
        except json.JSONDecodeError:
            print(f" [AVISO] O arquivo {nome_arquivo} está corrompido. Iniciando com estoque vazio.")
            return []
    
    return []

def salvar_estoque():
    """Salva o estado atual do estoque (lista global) no arquivo JSON."""
    global estoque
    # Abre o arquivo no modo de escrita ('w')
    with open('estoque.json', 'w') as arquivo:
        json.dump(estoque, arquivo, indent=4)
    # print("\n [LOG] Dados salvos em estoque.json.")

# Carrega o estoque em memória ao iniciar o módulo
estoque = carregar_estoque()

# --- FUNÇÕES DE LÓGICA DE NEGÓCIOS ---

def visualizar_estoque():
    """Retorna a lista completa de produtos."""
    global estoque
    return estoque

def adicionar_produto(codigo: str, nome: str, preco: float, qtd: int):
    """
    Função UPSERT: Adiciona um novo produto ou ATUALIZA um existente (se o código for encontrado).
    Isto alinha com a lógica esperada pelo app.py.
    """
    global estoque
    
    # Procura pelo produto existente
    item_existente = next((item for item in estoque if item['codigo'] == codigo), None)

    if item_existente:
        # Atualiza o produto existente
        item_existente['nome'] = nome
        item_existente['preco'] = preco
        item_existente['qtd'] = qtd
        produto_resultante = item_existente
    else:
        # Cria um novo produto e adiciona à lista
        novo_produto = {
            'codigo': codigo, 
            'nome': nome, 
            'preco': preco, 
            'qtd': qtd
        }
        estoque.append(novo_produto)
        produto_resultante = novo_produto
        
    salvar_estoque()
    return produto_resultante

def registrar_venda(codigo: str, quantidade: int = 1):
    """
    Registra a venda de 'quantidade' de um produto. 
    (Função renomeada de 'registrar_saida' para 'registrar_venda' para casar com app.py)
    """
    global estoque

    for item in estoque:
        if item['codigo'] == codigo:
            if item['qtd'] >= quantidade:
                item['qtd'] -= quantidade
                salvar_estoque()
                return {
                    "status": "sucesso", 
                    "mensagem": f"Venda de {quantidade} unidade(s) de {item['nome']} registrada.",
                    "item": item
                }
            else:
                return {"status": "erro", "mensagem": f"Estoque insuficiente. Apenas {item['qtd']} unidades restantes."}
    
    return {"status": "erro", "mensagem": "Código não encontrado."}


def excluir_produto(codigo: str):
    """Remove um produto do estoque."""
    global estoque
    
    # Cria uma nova lista sem o item a ser excluído
    estoque_antes = len(estoque)
    estoque = [item for item in estoque if item['codigo'] != codigo]
    estoque_depois = len(estoque)
    
    if estoque_antes > estoque_depois:
        salvar_estoque()
        return {"status": "sucesso", "mensagem": f"Produto {codigo} excluído."}
    
    return {"status": "erro", "mensagem": "Código não encontrado."}

# Nota: A função 'editar_produto' foi removida, pois sua lógica foi absorvida pela função 'adicionar_produto',
# o que simplifica o 'app.py' (lógica UPSERT).