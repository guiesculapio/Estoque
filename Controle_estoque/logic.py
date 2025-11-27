import json
import os 

def carregar_estoque():
    nome_arquivo = 'estoque.json'
    
    #1. Checks if the file exists AND if it has content (size > 0)
    if os.path.exists(nome_arquivo) and os.path.getsize(nome_arquivo) > 0:
        try:
            with open(nome_arquivo, 'r') as arquivo:
                return json.load(arquivo)
        except json.JSONDecodeError:
            # Captures the error if the file exists but is corrupted.
            print(f" Aviso: O arquivo {nome_arquivo} está corrompido. Iniciando com estoque vazio.")
            return []
    
    #2. If it does not exist or is empty, returns an empty list.
    return []

estoque = carregar_estoque()

def salvar_estoque():
    # Opens the 'estoque.json' file in write mode ('w')
    # The 'w' overwrites the file with the most current data.
    with open('estoque.json', 'w') as arquivo:
        # Transforms the 'stock' list into JSON format and saves it to the file.
       # 'indent=4' simply formats the JSON file to be readable.
        json.dump(estoque, arquivo, indent=4)
    print("\n Dados salvos em estoque.json.")

def adicionar_produto(codigo, nome, preco, qtd):
    global estoque

    roupa = {'codigo': codigo, 'nome': nome, 'preco': preco, 'qtd': qtd}
    estoque.append(roupa)
    salvar_estoque() # Saves immediately after adding

    # Returns the added item
    return roupa

def registrar_saida(codigo_saida):
    global estoque

    for item in estoque:
        if item['codigo'] == codigo_saida:
            if item['qtd'] > 0:
                item['qtd'] -= 1
                salvar_estoque() # Saved immediately after exiting
                return {"status": "sucesso", "item": item} # Returns success and the item updated.
            else:
                return {"status": "erro", "mensagem": "Estoque zerado."} # Return error
    
    return {"status": "erro", "mensagem": "Código não encontrado."} # Return error

def visualizar_estoque():
    global estoque
    return estoque

def editar_produto(codigo, novo_nome, novo_preco, nova_qtd):
    global estoque
    
    for item in estoque:
        if item['codigo'] == codigo:
            #1. Updates the item fields.
            item['nome'] = novo_nome
            item['preco'] = novo_preco
            item['qtd'] = nova_qtd
            
            #2. Save the change to JSON.
            salvar_estoque()
            
            #3. Returns the updated item.
            return {"status": "sucesso", "item": item}
            
    # If the loop ends and the code is not found
    return {"status": "erro", "mensagem": "Código não encontrado."}


def excluir_produto(codigo_excluir):
    global estoque
    
    # We use a temporary copy of the inventory to iterate
    # while removing from the original list
    for item in list(estoque):
        if item['codigo'] == codigo_excluir:
            estoque.remove(item)
            salvar_estoque()
            return {"status": "sucesso", "mensagem": f"Produto {codigo_excluir} excluído."}

    return {"status": "erro", "mensagem": "Código não encontrado."}
