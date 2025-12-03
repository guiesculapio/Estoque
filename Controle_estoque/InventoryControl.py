import json

def load_stock():
    try:
        with open('estoque.json', 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return []

stock = load_stock()

def save_stock():
    with open('estoque.json', 'w') as file:
        json.dump(stock, file, indent=4)
    print("\n Dados salvos em estoque.json.")

def add_product():
    global stock
    print("\n--- NOVO PRODUTO ---")
    name = input('Digite o nome do produto: ')
    code = input('Digite o código unico do produto: ').strip().upper()

    try:
        price = float(input('Digite o preço: '))
        quantity = int(input('Digite a Quantidade: '))
    except ValueError:
        print("\n[ERRO] Preço e Quantidade devem ser números válidos. Cadastro cancelado.")
        return

    product = {
        'code': code,
        'name': name,
        'price': price,
        'quantity': quantity
    }

    stock.append(product)
    print(f"\n✅ Produto '{name}' adicionado com sucesso!")

def register_sale():
    global stock
    print("\n-- REGISTRAR VENDA ---")

    scan_code = input('Digite/Leia o código do produto: ').strip().upper()

    for item in stock:
        if item['code'] == scan_code:
            if item['quantity'] > 0:
                item['quantity'] -= 1
                print(f"\n VENDA REGISTRADA: {item['name']}")
                print(f"   Estoque atual: {item['quantity']} unidades.")
                return
            else:
                print(f"\n ERRO: {item['name']} (Código: {scan_code}) está zerado no estoque.")
                return

    print(f"\n ERRO: Código: {scan_code} não encontrado no estoque.")

def view_stock():
    if not stock:
        print('\n--- Estoque Vazio ---')
        return

    print("\n--- ESTOQUE COMPLETO ---")

    print(f"{'Nome':<20} {'Preço':<10} {'Qtd'}")
    print("-" * 35)

    for item in stock:
        print(f"{item['name']:<20} R${item['price']:<8.2f} {item['quantity']}")
    print("-" * 35)

def main():
    while True:
        print('\n--- MENU ---')
        print('1. Cadastrar Produto')
        print('2. Visualizar Estoque')
        print('3 Registrar Venda')
        print('4. Sair')
        option = input('Escolha: ')

        if option == '1':
            add_product()
        elif option == '2':
            view_stock()
        elif option == '3':
            register_sale()
        elif option == '4':
            save_stock()
            print('Saindo do sistema...')
            break
        else:
            print('Opção Inválida!')

        input('Pressione Enter Para Continuar...')

main()
