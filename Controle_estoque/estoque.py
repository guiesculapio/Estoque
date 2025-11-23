import json

def carregar_estoque():
    #Try/except para tratar o erro FileNotFoundError
    #(o arquivo não existe na primeira vez que o programa roda)
    try:
        # Abre o arquivo 'estoque.json' em modo leitura ('r')
        with open('estoque.json', 'r') as arquivo:
            # Lê o conteúdo do arquivo JSON e transforma em lista Python
            return json.load(arquivo)
    except FileNotFoundError:
        # Se o arquivo não for encontrado, retorna uma lista vazia
        return []

estoque = carregar_estoque()

def salvar_estoque():
    # Abre o arquivo 'estoque.json' em modo escrita ('w')
    # O 'w' sobrescreve o arquivo com os dados mais atuais.
    with open('estoque.json', 'w') as arquivo:
        # Transforma a lista 'estoque' em formato JSON e salva no arquivo
        # 'indent=4' apenas formata o arquivo JSON para ser legível
        json.dump(estoque, arquivo, indent=4)
    print("\n Dados salvos em estoque.json.")

def adicionar_produto():
    global estoque
    print("\n--- NOVO PRODUTO ---")
    nome = input('Digite o nome do produto: ')

    try:
        preco = float(input('Digite o preço: '))
        qtd = int(input('Digite a Quantidade: '))
    except ValueError:
        print("\n[ERRO] Preço e Quantidade devem ser números válidos. Cadastro cancelado.")
        return

    roupa = {'nome':nome,'preco':preco,'qtd':qtd}
    estoque.append(roupa)
    print(f"\n✅ Produto '{nome}' adicionado com sucesso!")


def visualizar_estoque():
    if not estoque:
        print('\n--- Estoque Vazio ---')
        return

    print("\n--- ESTOQUE COMPLETO ---")

    print(f"{'Nome':<20} {'Preço':<10} {'Qtd'}")
    print("-" * 35)

    for item in estoque:
        print(f"{item['nome']:<20} R${item['preco']:<8.2f} {item['qtd']}")
    print("-" * 35)

def main():
    while True:
        print('\n--- MENU ---')
        print('1. Cadastrar Produto')
        print('2. Visualizar Estoque')
        print('3. Sair')
        opcao = input('Escolha: ')

        if opcao == '1':
            adicionar_produto()
        elif opcao == '2':
            visualizar_estoque()
        elif opcao == '3':
            salvar_estoque()
            print('Saindo do sistema...')
            break
        else:
            print('Opção Inválida!')

        input('Pressione Enter Para Continuar...')
main()