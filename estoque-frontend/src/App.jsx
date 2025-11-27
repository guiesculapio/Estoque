import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Importa o Axios
import './App.css'; 

function App() {
  const [estoque, setEstoque] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para armazenar os dados do novo produto (Cadastro)
  const [novoProduto, setNovoProduto] = useState({
    codigo: '',
    nome: '',
    preco: '',
    qtd: ''
  });
  
  // NOVO: Estado para controlar o campo de input do scanner/código de barras
  const [barcodeInput, setBarcodeInput] = useState('');

  const API_URL = 'http://localhost:5000/estoque'; 

  // FUNÇÃO DE BUSCA (GET): Mover para fora do useEffect para ser reutilizável
  const buscarEstoque = async () => {
    try {
      console.log("Fazendo requisição GET para a API Flask...");
      const response = await axios.get(API_URL);
      
      setEstoque(response.data); 
      setLoading(false);
      console.log("Dados recebidos (atualizados):", response.data);
    } catch (error) {
      console.error("Erro ao buscar dados da API:", error);
      setLoading(false);
    }
  };

  // useEffect - Roda apenas uma vez na montagem do componente
  useEffect(() => {
    buscarEstoque();
  }, []); 

  // FUNÇÃO DEDICADA PARA PROCESSAR A VENDA (PUT)
  const processSale = async (codigo, qtdVendida) => {
    const code = codigo.toUpperCase(); // Garante que o código é maiúsculo

    if (!code || qtdVendida <= 0) {
        alert("Código de produto inválido ou quantidade zero.");
        return;
    }

    // 1. Encontra o item atual para calcular a nova quantidade
    const itemAtual = estoque.find(item => item.codigo === code);

    if (!itemAtual) {
        alert(`Produto com código ${code} não encontrado no estoque.`);
        return;
    }
    
    const novaQtd = parseInt(itemAtual.qtd) - qtdVendida;

    if (novaQtd < 0) {
        alert(`Não é possível vender ${qtdVendida} unidades. Estoque atual de ${itemAtual.nome}: ${itemAtual.qtd}.`);
        return;
    }

    try {
        const URL_EDITAR = 'http://localhost:5000/estoque/editar';
        
        // 2. Envia a requisição PUT com a nova quantidade total
        const dadosAtualizados = {
            codigo: code,
            nome: itemAtual.nome,
            preco: itemAtual.preco,
            qtd: novaQtd // Envia a quantidade final (estoque - venda)
        };

        await axios.put(URL_EDITAR, dadosAtualizados);

        console.log(`Venda de ${qtdVendida} unidades do produto ${code} registrada com sucesso.`);
        
        // 3. Atualiza a tabela imediatamente
        await buscarEstoque();

    } catch (error) {
        const errorMessage = error.response?.data?.mensagem || "Erro ao processar venda.";
        console.error("Erro ao processar venda:", error);
        alert(`Falha ao registrar venda: ${errorMessage}`);
    }
  };

  // NOVO: FUNÇÃO PARA SIMULAR A LEITURA DO CÓDIGO DE BARRAS (Enter key)
  const handleBarcodeScan = async (e) => {
    // Verifica se a tecla pressionada é "Enter"
    if (e.key === 'Enter') {
        e.preventDefault(); // Impede que o formulário recarregue a página
        
        const codigo = barcodeInput;
        setBarcodeInput(''); // Limpa o campo para a próxima leitura
        
        // Assume a venda de 1 unidade para a leitura rápida
        await processSale(codigo, 1);
    }
  };


  // FUNÇÃO DE CADASTRO (POST)
  const handleCadastro = async (e) => {
    e.preventDefault(); 
    try {
      const URL_CADASTRO = 'http://localhost:5000/estoque/cadastro';
      await axios.post(URL_CADASTRO, novoProduto);
      console.log("Cadastro de Produto bem-sucedido.");
      await buscarEstoque(); 
      setNovoProduto({ codigo: '', nome: '', preco: '', qtd: '' });
      
    } catch (error) {
      const errorMessage = error.response?.data?.mensagem || "Verifique se o servidor Flask está rodando ou se o código já existe.";
      console.error("Erro ao cadastrar produto:", error);
      alert(`Falha ao cadastrar: ${errorMessage}`);
    }
  };

  // FUNÇÃO DE EXCLUSÃO (DELETE)
  const handleDelete = async (codigo) => {
    const confirmacao = window.confirm(`Tem certeza que deseja excluir o produto com código ${codigo}?`);
    if (!confirmacao) return;
    
    try {
      const URL_EXCLUIR = 'http://localhost:5000/estoque/excluir';
      await axios.delete(URL_EXCLUIR, { data: { codigo: codigo } });
      console.log(`Produto ${codigo} excluído com sucesso.`);
      await buscarEstoque(); 
      
    } catch (error) {
      const errorMessage = error.response?.data?.mensagem || "Verifique se o servidor Flask está rodando.";
      console.error("Erro ao excluir produto:", error);
      alert(`Falha ao excluir: ${errorMessage}`);
    }
  };
  

  if (loading) {
    return <h1>Carregando dados do servidor Flask...</h1>;
  }

  return (
    <div style={{ 
        padding: '20px', 
        fontFamily: 'Inter, sans-serif',
        backgroundColor: '#282c34', 
        color: '#f0f0f0',
        minHeight: '100vh'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#61dafb' }}>Crowned Tendência</h1>
      
      {/* Estilização para campos e botões (CSS inline e com style jsx) */}
      <style jsx>{`
            input, button {
                width: 100%;
                padding: 10px;
                margin-bottom: 15px;
                border-radius: 5px;
                border: none;
                box-sizing: border-box;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
                color: #ccc;
            }
            form {
                max-width: 600px; 
                margin: 0 auto 40px; 
                padding: 30px; 
                border: 1px solid #444; 
                border-radius: 10px;
                background-color: #333;
            }
            button[type="submit"] {
                background-color: #61dafb;
                color: #282c34;
                font-weight: bold;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            button[type="submit"]:hover {
                background-color: #21a1f1;
            }
            .delete-btn {
                background-color: #ff4d4d;
                color: white;
                padding: 5px 10px;
                width: auto;
                margin: 0;
            }
            .delete-btn:hover {
                background-color: #cc0000;
            }
            .scan-input { /* Estilo específico para o input do scanner */
                border: 2px solid #4CAF50 !important; /* Borda verde para destaque */
                font-size: 1.2em;
                text-transform: uppercase;
                text-align: center;
                color: #333;
                background-color: #f0f0f0;
            }
            /* Removido estilos desnecessários do formulário de venda antigo */
        `}</style>
      
      {/* NOVO: FORMULÁRIO DE SCANNER RÁPIDO */}
      <form style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', borderBottom: '1px solid #4CAF50', paddingBottom: '10px', marginBottom: '20px' }}> Scanner de Checkout Rápido (Venda -1)</h2>
        
        <label>Código de Barras ou do Produto:</label>
        <input 
          type="text" 
          className="scan-input"
          placeholder="Leia ou Digite o Código e Pressione ENTER"
          value={barcodeInput}
          // Garante que o input fica em foco para receber o próximo scan/digitação
          autoFocus 
          onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
          // Lógica principal: Chama handleBarcodeScan ao pressionar uma tecla
          onKeyDown={handleBarcodeScan} 
        />
        <p style={{textAlign: 'center', fontSize: '0.9em', color: '#ccc'}}>*Cada código lido/digitado baixa 1 unidade do estoque automaticamente.</p>
      </form>
      
      {/* FORMULÁRIO DE CADASTRO (POST) */}
      <form onSubmit={handleCadastro} style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#fff', borderBottom: '1px solid #61dafb', paddingBottom: '10px', marginBottom: '20px' }}> Cadastrar Novo Produto </h2>
        
        <label>Código:</label>
        <input 
          type="text" 
          placeholder="Ex: CAMISA001"
          value={novoProduto.codigo}
          onChange={(e) => setNovoProduto({...novoProduto, codigo: e.target.value.toUpperCase()})}
          required
        />
        
        <label>Nome:</label>
        <input 
          type="text" 
          placeholder="Ex: Camiseta Básica P"
          value={novoProduto.nome}
          onChange={(e) => setNovoProduto({...novoProduto, nome: e.target.value})}
          required
        />
        
        <label>Preço (R$):</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="Ex: 49.99"
          value={novoProduto.preco}
          onChange={(e) => setNovoProduto({...novoProduto, preco: e.target.value})}
          required
        />
        
        <label>Quantidade:</label>
        <input 
          type="number" 
          placeholder="Ex: 10"
          value={novoProduto.qtd}
          onChange={(e) => setNovoProduto({...novoProduto, qtd: e.target.value})}
          required
        />
        
        <button type="submit">Cadastrar Produto</button>
      </form>
      
      {/* TABELA DE ESTOQUE (READ) */}
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#fff' }}> Estoque Atual</h2>

      {estoque.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#ffcc00' }}>Estoque vazio. Use o formulário de cadastro.</p>
      ) : (
        <table style={{ 
            border: '1px solid #444', 
            borderCollapse: 'collapse', 
            width: '80%', 
            margin: '0 auto',
            backgroundColor: '#333',
            borderRadius: '5px',
            overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ background: '#61dafb', color: '#282c34' }}>
              <th style={{ border: '1px solid #444', padding: '12px' }}>Código</th>
              <th style={{ border: '1px solid #444', padding: '12px' }}>Nome</th>
              <th style={{ border: '1px solid #444', padding: '12px' }}>Preço</th>
              <th style={{ border: '1px solid #444', padding: '12px' }}>Qtd</th>
              <th style={{ border: '1px solid #444', padding: '12px' }}>Ações</th> 
            </tr>
          </thead>
          <tbody>
            {estoque.map((item) => (
              <tr key={item.codigo} style={{ borderBottom: '1px solid #444' }}>
                <td style={{ border: '1px solid #444', padding: '10px', textAlign: 'center' }}>{item.codigo}</td>
                <td style={{ border: '1px solid #444', padding: '10px' }}>{item.nome}</td>
                <td style={{ border: '1px solid #444', padding: '10px', textAlign: 'right' }}>R$ {parseFloat(item.preco).toFixed(2)}</td>
                <td style={{ border: '1px solid #444', padding: '10px', textAlign: 'center' }}>{item.qtd}</td>
                <td style={{ border: '1px solid #444', padding: '10px', textAlign: 'center' }}>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(item.codigo)} 
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;