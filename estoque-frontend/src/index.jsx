import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Plus, X, Edit, ShoppingCart, Loader2, Save, AlertTriangle } from 'lucide-react';

// URL do seu backend Flask. Certifique-se de que o backend esteja rodando na porta 5000.
// ATENÇÃO: Se você modificou para usar AXIOS, certifique-se de ter importado 'axios' e ajustado as chamadas.
const API_URL = 'http://127.0.0.1:5000/estoque';

// Componente principal da aplicação
const App = () => {
    const [estoque, setEstoque] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formDados, setFormDados] = useState({ codigo: '', nome: '', preco: '', qtd: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [mensagem, setMensagem] = useState(null);
    // NOVO: Estado para o input do código de barras
    const [barcodeInput, setBarcodeInput] = useState('');
    
    // NOVO: Referência para focar o campo de código de barras
    const barcodeRef = useRef(null); 

    // Efeito para carregar o estoque ao iniciar
    useEffect(() => {
        fetchEstoque();
    }, []);
    
    // NOVO EFEITO: Foca no campo de código de barras após o carregamento inicial
    useEffect(() => {
        if (!loading && barcodeRef.current) {
            barcodeRef.current.focus();
        }
    }, [loading]);


    // --- FUNÇÕES DE API ---

    // Função para buscar todos os produtos (usando fetch, que estava no código original)
    const fetchEstoque = async () => {
        setLoading(true);
        try {
            // A sua imagem de código mostra que você estava usando AXIOS.
            // Para garantir que o código funcione, vou tentar usar o fetch.
            // Se você continuar tendo problemas, use axios.get(API_URL) no lugar.
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Falha ao carregar o estoque. Verifique se o Flask está rodando.');
            
            const data = await response.json();
            setEstoque(data);
        } catch (error) {
            console.error("Erro ao buscar estoque:", error);
            showUserMessage({ type: 'error', text: 'Não foi possível conectar ao backend Flask na porta 5000.' });
        } finally {
            setLoading(false);
        }
    };

    // Função para cadastrar/atualizar um produto (UPSERT)
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formDados.codigo || !formDados.nome || formDados.preco === '' || formDados.qtd === '') {
            showUserMessage({ type: 'error', text: 'Todos os campos são obrigatórios.' });
            return;
        }

        const dataToSend = {
            ...formDados,
            preco: parseFloat(String(formDados.preco).replace(',', '.')),
            qtd: parseInt(formDados.qtd, 10),
            codigo: String(formDados.codigo).toUpperCase()
        };
        
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/cadastro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });
            
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.erro || 'Erro desconhecido ao cadastrar/atualizar.');
            }

            fetchEstoque();
            resetForm();
            showUserMessage({ type: 'success', text: result.mensagem });

        } catch (error) {
            console.error("Erro no cadastro/atualização:", error);
            showUserMessage({ type: 'error', text: error.message || 'Erro ao comunicar com a API.' });
        } finally {
            setLoading(false);
        }
    };

    // Função para registrar uma venda (saída de estoque)
    // Opcionalmente atualizada para permitir quantidade variável (embora o botão use 1)
    const handleVenda = async (codigo, quantidade = 1) => {
        // Usando console.log em vez de window.confirm() para evitar bloqueio
        console.log(`Tentativa de venda de ${quantidade} unidade(s) do produto ${codigo}.`);
        
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/venda`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: codigo, quantidade: quantidade }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Se o erro for de "Estoque insuficiente", mostre uma mensagem específica
                if (result.erro && result.erro.includes("insuficiente")) {
                    throw new Error(result.erro);
                }
                throw new Error(result.erro || 'Erro ao registrar a venda.');
            }

            fetchEstoque();
            showUserMessage({ type: 'success', text: result.mensagem });
            return true; // Retorna sucesso
        } catch (error) {
            console.error("Erro na venda:", error);
            showUserMessage({ type: 'error', text: error.message || 'Erro ao registrar venda.' });
            return false; // Retorna falha
        } finally {
            setLoading(false);
        }
    };

    // NOVO: Função para lidar com o scan do código de barras
    const handleBarcodeScan = (e) => {
        // Um leitor de código de barras geralmente simula a tecla 'Enter' após o código.
        if (e.key === 'Enter') {
            e.preventDefault(); // Evita submeter formulário se houver
            const codigo = barcodeInput.toUpperCase().trim();
            if (codigo) {
                // Tenta registrar a venda
                const sucesso = handleVenda(codigo, 1);
                
                // Limpa o input imediatamente após a tentativa de venda
                setBarcodeInput(''); 
                
                // Se for um sucesso, o handleVenda já cuida da mensagem e do fetchEstoque
            } else {
                showUserMessage({ type: 'error', text: 'Código de barras vazio.' });
            }
        }
    };


    // Função para excluir um produto
    const handleExcluir = async (codigo) => {
        // Usando console.log em vez de window.confirm()
        console.log(`Tentativa de exclusão do produto ${codigo}.`);

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/excluir`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: codigo }),
            });
            
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.erro || 'Erro ao excluir o produto.');
            }

            fetchEstoque();
            showUserMessage({ type: 'success', text: result.mensagem });

        } catch (error) {
            console.error("Erro na exclusão:", error);
            showUserMessage({ type: 'error', text: error.message || 'Erro ao excluir produto.' });
        } finally {
            setLoading(false);
        }
    };

    // --- FUNÇÕES DE ESTADO E UI ---

    const handleEditClick = (item) => {
        setFormDados({
            codigo: item.codigo,
            nome: item.nome,
            preco: String(item.preco), 
            qtd: String(item.qtd),
        });
        setIsEditing(true);
        setShowForm(true);
    };

    const resetForm = () => {
        setFormDados({ codigo: '', nome: '', preco: '', qtd: '' });
        setIsEditing(false);
        setShowForm(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormDados(prev => ({ ...prev, [name]: value }));
    };

    const showUserMessage = ({ type, text }) => {
        setMensagem({ type, text });
        setTimeout(() => setMensagem(null), 5000);
    };

    const getMessageStyle = () => {
        if (!mensagem) return '';
        if (mensagem.type === 'success') {
            return 'bg-green-100 border-green-400 text-green-700';
        } else if (mensagem.type === 'error') {
            return 'bg-red-100 border-red-400 text-red-700';
        }
        return 'bg-blue-100 border-blue-400 text-blue-700';
    };

    // --- RENDERIZAÇÃO ---

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight sm:text-5xl">
                    Controle de Estoque
                </h1>
                <p className="mt-2 text-lg text-gray-500">
                    Gerencie seus produtos com Flask & React.
                </p>
            </header>

            {/* Componente de Mensagem Flutuante */}
            {mensagem && (
                <div className={`fixed top-4 right-4 z-50 p-4 border-l-4 rounded-lg shadow-lg transition-opacity duration-300 ${getMessageStyle()}`}>
                    <div className="flex items-center">
                        {mensagem.type === 'error' ? <AlertTriangle className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                        <span className="font-medium">{mensagem.text}</span>
                    </div>
                </div>
            )}
            
            {/* NOVO: CAMPO DE CÓDIGO DE BARRAS */}
            <div className="bg-white p-6 mb-8 rounded-xl shadow-2xl border border-blue-200">
                <h2 className="text-2xl font-bold text-blue-700 mb-4">
                    Leitor de Código de Barras (Venda Rápida)
                </h2>
                <input
                    ref={barcodeRef}
                    type="text"
                    name="barcodeInput"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeScan}
                    className="w-full p-4 border-2 border-blue-500 rounded-lg text-lg font-mono focus:ring-blue-500 focus:border-blue-700 transition duration-150"
                    placeholder="Escaneie o produto ou digite o código e pressione Enter..."
                    disabled={loading || showForm} 
                />
                {loading && (
                    <div className="mt-2 text-blue-500 flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aguardando comunicação com o servidor...
                    </div>
                )}
            </div>

            {/* Botão de Adicionar Produto */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        if (showForm) resetForm(); // Reseta se estiver fechando
                    }}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
                    disabled={loading}
                >
                    {showForm ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                    {showForm ? 'Fechar Formulário' : 'Novo Produto'}
                </button>
            </div>

            {/* Formulário de Cadastro/Edição */}
            {showForm && (
                <div className="bg-white p-6 mb-8 rounded-xl shadow-2xl border border-gray-100 transition-all duration-500 ease-in-out">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        {isEditing ? `Editar Produto: ${formDados.codigo}` : 'Cadastrar Novo Produto'}
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="col-span-1 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código (SKU)</label>
                            <input
                                type="text"
                                name="codigo"
                                value={formDados.codigo}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 uppercase"
                                placeholder="Ex: CAMISA001"
                                required
                                disabled={isEditing} 
                            />
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                            <input
                                type="text"
                                name="nome"
                                value={formDados.nome}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Camiseta Azul P"
                                required
                            />
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
                            <input
                                type="number"
                                name="preco"
                                value={formDados.preco}
                                onChange={handleInputChange}
                                step="0.01"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="99.90"
                                required
                            />
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                            <input
                                type="number"
                                name="qtd"
                                value={formDados.qtd}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="10"
                                required
                            />
                        </div>
                        <div className="md:col-span-4 flex justify-end space-x-4 mt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition duration-150"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow hover:bg-green-600 transition duration-150 flex items-center"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                {isEditing ? 'Salvar Edição' : 'Cadastrar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabela de Estoque */}
            <div className="bg-white p-6 rounded-xl shadow-2xl overflow-x-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Estoque Atual ({estoque.length} itens)</h2>
                {loading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-2" />
                        <span className="text-gray-500">Carregando dados...</span>
                    </div>
                )}
                {!loading && estoque.length === 0 && (
                    <div className="text-center py-10 text-gray-500">Nenhum produto em estoque. Comece adicionando um!</div>
                )}
                {!loading && estoque.length > 0 && (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {estoque.map((item) => (
                                <tr key={item.codigo} className="hover:bg-gray-50 transition duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.codigo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nome}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        R$ {item.preco.toFixed(2).replace('.', ',')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.qtd > 5 ? 'bg-green-100 text-green-800' : item.qtd > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                            {item.qtd}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                        
                                        {/* Botão de Venda/Saída */}
                                        <button
                                            onClick={() => handleVenda(item.codigo)}
                                            disabled={item.qtd <= 0 || loading}
                                            title="Registrar Venda (Saída de 1)"
                                            className={`p-2 rounded-full transition duration-150 ${item.qtd > 0 ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                        >
                                            <ShoppingCart className="w-5 h-5" />
                                        </button>
                                        
                                        {/* Botão de Edição */}
                                        <button
                                            onClick={() => handleEditClick(item)}
                                            disabled={loading}
                                            title="Editar Produto"
                                            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-150"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        
                                        {/* Botão de Exclusão */}
                                        <button
                                            onClick={() => handleExcluir(item.codigo)}
                                            disabled={loading}
                                            title="Excluir Produto"
                                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-150"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            <footer className="mt-8 text-center text-gray-400 text-sm">
                <p>Desenvolvido com React, Tailwind CSS e Flask.</p>
            </footer>
        </div>
    );
};

// Configuração de inicialização do React (equivalente ao main.jsx/index.js)
// Este bloco garante que o componente App seja renderizado no elemento com id='root'.
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
} else {
    console.error("Elemento com id 'root' não encontrado para renderização do React.");
}

export default App;