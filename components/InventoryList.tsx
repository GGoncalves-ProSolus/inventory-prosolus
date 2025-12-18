import React, { useState, useContext, useEffect } from 'react';
import { InventoryItem, InventoryStatus, TeamLeader } from '../src/types';
import { AuthContext } from '../App';
import { Search, Plus, Trash2, Edit2, AlertCircle, ChevronLeft, ChevronRight, Scale, Calculator, CheckCircle2, AlertTriangle, Users, BarChart3, Eye, Printer, Clock, PlusCircle, ScanBarcode, Loader2 } from 'lucide-react';

const InventoryList: React.FC = () => {
  const { auth } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminStatsOpen, setIsAdminStatsOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [leaders, setLeaders] = useState<TeamLeader[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estado do Formulário
  const [formData, setFormData] = useState<Omit<Partial<InventoryItem>, 'contagens'> & { contagens: (string | number)[] }>({
    codigo: '',
    descricao: '',
    tipo: '',
    unidade_sistema: '',
    cod_barras: '',
    armazem: '01',
    lider_equipe: '',
    codigo_etiqueta: '',
    unidade_contagem: '',
    usou_balanca: false,
    contagens: ['', ''],
  });

  const [scanInput, setScanInput] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const API_URL = 'http://localhost:5000';

  // --- FUNÇÕES DE BUSCA NO SERVIDOR ---

  const fetchLeaders = async () => {
    try {
      const response = await fetch(`${API_URL}/leaders`);
      if (response.ok) {
        const data = await response.json();
        setLeaders(data);
      }
    } catch (error) {
      console.error("Erro ao buscar líderes", error);
    }
  };

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/inventory?userId=${auth.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Erro ao buscar inventário", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (auth.user) {
      fetchLeaders();
      fetchItems();
    }
  }, [auth.user]); // Adicionado dependência auth.user

  // --- LÓGICA DE FILTRO ---
  const filteredItems = items.filter(item => {
    if (searchTerm.length <= 2) return true;
    const upperTerm = searchTerm.toUpperCase();
    return (
      (item.codigo || '').toUpperCase().includes(upperTerm) ||
      (item.descricao || '').toUpperCase().includes(upperTerm) ||
      (item.codigo_etiqueta || '').includes(upperTerm) ||
      (item.digitador_nome || '').toUpperCase().includes(upperTerm)
    );
  });

  const paginatedItems = filteredItems
    .slice() // Cria cópia
    // .reverse() // Removido reverse aqui pois o backend já traz ordenado por created_at DESC
    .slice((page - 1) * pageSize, page * pageSize);

  // Busca por Código do Produto (Catálogo)
  const handleCodeBlur = async () => {
    if (!formData.codigo) return;
    try {
      // Usa userId para busca, mas o backend agora é global para catálogo
      const response = await fetch(`${API_URL}/catalog/search?codigo=${formData.codigo}&userId=${auth.user?.id}`);
      if (response.ok) {
        const product = await response.json();
        if (product) {
          setFormData(prev => ({
            ...prev,
            descricao: product.descricao,
            tipo: product.tipo || '',
            unidade_sistema: product.unidade || 'UN',
            cod_barras: product.cod_barras || '',
            unidade_contagem: product.unidade || 'UN'
          }));
        }
      }
    } catch (error) {
      console.error("Erro ao buscar produto", error);
    }
  };

  // Busca por Código de Barras (Scanner)
  const handleBarcodeSearch = async (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    if (!scanInput) return;

    try {
      const response = await fetch(`${API_URL}/catalog/search?term=${scanInput}&userId=${auth.user?.id}`);
      if (response.ok) {
        const product = await response.json();
        if (product) {
          setFormData(prev => ({
            ...prev,
            codigo: product.codigo,
            descricao: product.descricao,
            tipo: product.tipo || '',
            unidade_sistema: product.unidade || 'UN',
            cod_barras: product.cod_barras || '',
            unidade_contagem: product.unidade || 'UN'
          }));
        } else {
          alert('Produto não encontrado no catálogo!');
        }
      }
    } catch (error) {
      console.error("Erro na busca", error);
    }
  };

  // Lógica de Análise
  const analyzeCounts = (counts: (string | number)[], isBalance: boolean): { status: InventoryStatus, nextAction: string, diff: number } => {
    const validCounts = counts
      .filter(c => c !== '' && c !== null && c !== undefined)
      .map(Number)
      .filter(n => !isNaN(n));

    if (validCounts.length < 2) {
      return { status: 'EM_ANDAMENTO', nextAction: 'Aguardando 2ª Contagem', diff: 0 };
    }

    const tolerance = isBalance ? 0.0025 : 0.0001;
    const lastIndex = validCounts.length - 1;
    const lastCount = validCounts[lastIndex];
    const prevCount = validCounts[lastIndex - 1];
    const diff = Math.abs(lastCount - prevCount);

    if (diff <= tolerance) {
      return { status: 'INVENTARIADO', nextAction: 'Concluído', diff };
    } else {
      const nextCountNumber = validCounts.length + 1;
      return {
        status: 'REVISAO',
        nextAction: `Realizar ${nextCountNumber}ª Contagem`,
        diff
      };
    }
  };

  const openNewCountModal = () => {
    setEditingId(undefined);
    setIsViewMode(false);
    setScanInput('');
    setFormData({
      codigo: '', descricao: '', tipo: '', unidade_sistema: '', cod_barras: '',
      armazem: '01', lider_equipe: '', codigo_etiqueta: '', unidade_contagem: '', usou_balanca: false,
      contagens: ['', '']
    });
    setIsModalOpen(true);
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setIsViewMode(false);
    setScanInput('');

    // BLINDAGEM: Garante que seja array, mesmo se o banco devolver número
    let rawCounts = item.contagens;
    if (!Array.isArray(rawCounts)) {
      rawCounts = rawCounts ? [rawCounts] : [];
    }

    // Completa com vazio se tiver menos de 2
    let loadedCounts: (number | string)[] = [...rawCounts];
    if (loadedCounts.length < 2) {
      loadedCounts = [...loadedCounts, '', ''].slice(0, 2);
    }

    // Se estiver em revisão e todas as contagens anteriores forem válidas, adiciona campo para próxima
    if (item.status === 'REVISAO') {
      const validCounts = loadedCounts.filter(c => Number(c) > 0);
      if (loadedCounts.length === validCounts.length) {
        loadedCounts.push('');
      }
    }

    setFormData({ ...item, contagens: loadedCounts });
    setIsModalOpen(true);
  };

  const handleView = (item: InventoryItem) => {
    setEditingId(item.id);
    setIsViewMode(true);
    setScanInput('');

    // BLINDAGEM VISUALIZAÇÃO
    let rawCounts = item.contagens;
    if (!Array.isArray(rawCounts)) {
      rawCounts = rawCounts ? [rawCounts] : [0, 0];
    }

    setFormData({ ...item, contagens: rawCounts });
    setIsModalOpen(true);
  };

  const handleCountChange = (index: number, value: string) => {
    const newCounts = [...formData.contagens];
    newCounts[index] = value;
    setFormData({ ...formData, contagens: newCounts });
  };

  const addNextCount = () => {
    const newCounts = [...formData.contagens];
    newCounts.push('');
    setFormData({ ...formData, contagens: newCounts });
  };

  // --- SALVAR NO BACKEND ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo) {
      alert("Informe o código do produto.");
      return;
    }

    const rawCounts = formData.contagens;
    const countsToSave = rawCounts.map(c => c === '' ? 0 : Number(c));
    const analysis = analyzeCounts(rawCounts, !!formData.usou_balanca);

    const itemToSave = {
      ...formData,
      user_id: auth.user?.id,
      sector: auth.user?.sector || 'GERAL', // Adicionado setor para segurança

      contagens: countsToSave,
      qtde_contagem_1: countsToSave[0] || 0,
      qtde_contagem_2: countsToSave[1] || 0,
      diferenca: analysis.diff,
      status: analysis.status,
      proxima_acao: analysis.nextAction,
      digitador_nome: auth.user?.name // Garante nome do digitador
    };

    try {
      let response;
      if (editingId) {
        response = await fetch(`${API_URL}/inventory/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemToSave)
        });
      } else {
        response = await fetch(`${API_URL}/inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemToSave)
        });
      }

      if (response.ok) {
        await fetchItems();
        setIsModalOpen(false);
      } else {
        alert("Erro ao salvar no servidor.");
      }
    } catch (error) {
      alert("Erro de conexão ao salvar.");
    }
  };

  const handleDelete = async (id?: number) => {
    if (id && window.confirm("Tem certeza que deseja excluir esta contagem?")) {
      try {
        await fetch(`${API_URL}/inventory/${id}`, { method: 'DELETE' });
        await fetchItems();
      } catch (error) {
        alert("Erro ao excluir.");
      }
    }
  };

  const handlePrintRevisions = () => {
    const revisionItems = items.filter(i => i.status === 'REVISAO');

    if (revisionItems.length === 0) {
      alert("Não há itens marcados para Revisão.");
      return;
    }
    // Lógica de impressão (simplificada para o exemplo)
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><body><h1>Itens para Revisão</h1>');
      // ... (resto da lógica de impressão)
      printWindow.document.write('</body></html>');
      printWindow.print();
    }
  };

  // Componente de Stats
  const DigitadorStats = () => {
    const grouped: Record<string, { total: number, inventariado: number, revisao: number }> = {};

    items.forEach(item => {
      const name = item.digitador_nome || 'Desconhecido';
      if (!grouped[name]) grouped[name] = { total: 0, inventariado: 0, revisao: 0 };
      grouped[name].total++;
      if (item.status === 'INVENTARIADO') grouped[name].inventariado++;
      if (item.status === 'REVISAO') grouped[name].revisao++;
    });

    return (
      <div className="space-y-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Users className="w-5 h-5" /> Produtividade por Digitador</h3>
        <div className="grid gap-4">
          {Object.entries(grouped).map(([name, data]) => (
            <div key={name} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 flex justify-between items-center shadow-sm">
              <div><p className="font-bold text-lg text-gray-900">{name}</p><p className="text-xs text-gray-500">Itens Totais: {data.total}</p></div>
              <div className="flex gap-4 text-sm">
                <div className="text-center"><span className="block font-bold text-primary-600">{data.inventariado}</span><span className="text-xs text-gray-500">OK</span></div>
                <div className="text-center"><span className="block font-bold text-accent-500">{data.revisao}</span><span className="text-xs text-gray-500">Revisão</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const currentAnalysis = analyzeCounts(formData.contagens, !!formData.usou_balanca);

  // Helper para exibir contagens na tabela (Blindagem)
  const renderTableCounts = (contagens: any) => {
    if (Array.isArray(contagens)) {
      return contagens.filter(n => Number(n) > 0).join(' ➔ ');
    }
    // Se for número único vindo do banco antigo
    return contagens ? contagens : '0';
  };

  return (
    <div className="space-y-6">
      <datalist id="leaders-list">
        {leaders.map(leader => <option key={leader.id} value={leader.name} />)}
      </datalist>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel de Contagem</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isLoading ? 'Carregando dados...' : `Gerenciando ${items.length.toLocaleString()} itens no banco de dados.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handlePrintRevisions} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-all border border-gray-300 dark:border-gray-700">
            <Printer className="w-4 h-4" /> Imprimir Revisões
          </button>
          <button onClick={() => setIsAdminStatsOpen(true)} className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-lg font-medium transition-all border border-primary-200 dark:border-primary-800">
            <BarChart3 className="w-4 h-4" /> Relatório Equipe
          </button>
          <button onClick={openNewCountModal} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all">
            <Plus className="w-4 h-4" /> Nova Contagem
          </button>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-1/2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por Etiqueta, Código, Descrição ou Digitador..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-gray-900" />
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>Página {page}</span>
          <div className="flex rounded-md shadow-sm">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(p => p + 1)} disabled={paginatedItems.length < pageSize && page * pageSize >= filteredItems.length} className="px-3 py-1.5 border-l-0 border border-gray-300 dark:border-gray-600 rounded-r-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Tabela Principal */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-semibold">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Número da Ficha</th>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Contagens</th>
                <th className="px-6 py-4">Próx. Ação</th>
                <th className="px-6 py-4">Digitador</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></td></tr>
              ) : !paginatedItems.length ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center gap-3"><AlertCircle className="w-8 h-8 text-gray-300 dark:text-gray-600" /><p>Nenhum item encontrado.</p></div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-3">
                      {item.status === 'INVENTARIADO' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200"><CheckCircle2 className="w-3 h-3 text-green-600" /> OK</span>}
                      {item.status === 'REVISAO' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200"><AlertTriangle className="w-3 h-3" /> Revisão</span>}
                      {item.status === 'EM_ANDAMENTO' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200"><Clock className="w-3 h-3" /> Andamento</span>}
                    </td>
                    <td className="px-6 py-3 font-bold text-primary-600">{item.codigo_etiqueta || '-'}</td>
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{item.codigo}</td>
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300 truncate max-w-xs" title={item.descricao}>{item.descricao}</td>
                    <td className="px-6 py-3 font-mono text-gray-600 dark:text-gray-400">
                      {renderTableCounts(item.contagens)}
                    </td>
                    <td className="px-6 py-3 text-gray-800 dark:text-gray-200 font-medium text-xs">{item.proxima_acao || '-'}</td>
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400 text-xs">{item.digitador_nome}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleView(item)} className="p-1 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleEdit(item)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdminStatsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">Relatório de Desempenho</h3>
              <button onClick={() => setIsAdminStatsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]"><DigitadorStats /></div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden my-8 border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{isViewMode ? 'Visualizar Item' : editingId ? 'Editar Contagem' : 'Nova Contagem'}</h3>
                <p className="text-xs text-gray-500">Preencha os campos. Fundo branco para alto contraste.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 text-2xl">&times;</button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col lg:flex-row">
              {/* Lado Esquerdo: Dados do Sistema */}
              <div className="w-full lg:w-1/3 bg-gray-50 p-6 border-r border-gray-200">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><ScanBarcode className="w-4 h-4" /> Dados do Sistema</h4>
                <div className="space-y-4">
                  <div className={`p-3 rounded-lg border-2 ${!scanInput ? 'border-dashed border-gray-300' : 'border-blue-500 bg-blue-50'}`}>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Usar Leitor (Bipar aqui)</label>
                    <div className="relative">
                      <input disabled={isViewMode || !!editingId} className="w-full border border-gray-300 rounded-lg p-2 pl-8 focus:ring-2 focus:ring-black outline-none font-mono text-sm text-black bg-white disabled:bg-gray-100 disabled:text-gray-500" value={scanInput} onChange={e => setScanInput(e.target.value)} onKeyDown={handleBarcodeSearch} placeholder="Bipe o código..." />
                      <ScanBarcode className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="border-t border-gray-200 my-4"></div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Código do Produto</label>
                    <div className="relative">
                      <input required autoFocus={!isViewMode} disabled={isViewMode || !!editingId} className="w-full border-2 border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black outline-none font-bold text-black bg-white disabled:bg-gray-100 disabled:text-gray-500" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })} onBlur={handleCodeBlur} placeholder="Digite e aperte Tab" />
                      {!editingId && !isViewMode && <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Descrição</label><textarea disabled rows={3} className="w-full border border-gray-300 bg-white rounded-lg p-2 text-black text-sm resize-none disabled:bg-gray-100 disabled:text-gray-600" value={formData.descricao} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Unid. Sistema</label><input disabled className="w-full border border-gray-300 bg-white rounded-lg p-2 text-black disabled:bg-gray-100 disabled:text-gray-600" value={formData.unidade_sistema} /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Tipo</label><input disabled className="w-full border border-gray-300 bg-white rounded-lg p-2 text-black disabled:bg-gray-100 disabled:text-gray-600" value={formData.tipo} /></div>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Código de Barras (Sistema)</label><input disabled className="w-full border border-gray-300 bg-white rounded-lg p-2 text-black font-mono text-xs disabled:bg-gray-100 disabled:text-gray-600" value={formData.cod_barras} /></div>
                </div>
              </div>

              {/* Lado Direito: Dados da Contagem */}
              <div className="w-full lg:w-2/3 p-6 bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2"><Edit2 className="w-4 h-4" /> Dados da Contagem (Preencher)</h4>
                  {currentAnalysis.status === 'REVISAO' && <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200 animate-pulse">⚠ {currentAnalysis.nextAction}</span>}
                  {currentAnalysis.status === 'INVENTARIADO' && <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">✔ Inventário OK</span>}
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Líder da Equipe</label><input list="leaders-list" disabled={isViewMode} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black outline-none text-black bg-white disabled:bg-gray-100" placeholder="Selecione ou digite..." value={formData.lider_equipe} onChange={e => setFormData({ ...formData, lider_equipe: e.target.value })} /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Número da Ficha</label><input disabled={isViewMode} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black outline-none font-bold text-black bg-white disabled:bg-gray-100" value={formData.codigo_etiqueta} onChange={e => setFormData({ ...formData, codigo_etiqueta: e.target.value })} /></div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Armazém</label>
                    <select disabled={isViewMode} className="w-full border border-gray-300 rounded-lg p-2 bg-white text-black focus:ring-2 focus:ring-black outline-none disabled:bg-gray-100" value={formData.armazem} onChange={e => setFormData({ ...formData, armazem: e.target.value })}>
                      <option value="01">01 - Principal</option><option value="02">02 - Secundário</option><option value="04">04 - Expedição</option><option value="13">13 - Avarias</option><option value="98">98 - Trânsito</option>
                    </select>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Unid. Contagem (Visual)</label><input required disabled={isViewMode} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-black outline-none text-black bg-white disabled:bg-gray-100" placeholder="Ex: UN, CX" value={formData.unidade_contagem} onChange={e => setFormData({ ...formData, unidade_contagem: e.target.value })} /></div>
                </div>

                <div className="flex items-center mb-6">
                  <label className="flex items-center cursor-pointer gap-3 p-3 border border-gray-200 rounded-lg w-full hover:bg-gray-50 transition-colors bg-white">
                    <input type="checkbox" disabled={isViewMode} className="w-5 h-5 text-black rounded focus:ring-black border-gray-300" checked={formData.usou_balanca} onChange={e => setFormData({ ...formData, usou_balanca: e.target.checked })} />
                    <div className="flex flex-col"><span className="text-sm font-bold text-gray-900 flex items-center gap-2"><Scale className="w-4 h-4" /> Usou Balança?</span></div>
                  </label>
                </div>

                {/* AREA DE CONTAGENS DINÂMICAS */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                  <h5 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2 mb-2">Histórico de Contagens</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(formData.contagens || []).map((countValue, index) => (
                      <div key={index} className="relative">
                        <label className="block text-xs font-bold text-gray-700 mb-1">{index + 1}ª Contagem {index > 0 && typeof countValue === 'number' && typeof formData.contagens[index - 1] === 'number' && (<span className="text-[10px] text-gray-400 font-normal ml-1">(vs {index}ª: {Math.abs(Number(countValue) - Number(formData.contagens[index - 1])).toFixed(4)})</span>)}</label>
                        <div className="relative">
                          <Calculator className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                          <input type="number" step="0.0001" required={index < 2} disabled={isViewMode || ((formData.contagens?.length || 0) > 2 && index < (formData.contagens?.length || 0) - 1)} className={`w-full border rounded-lg p-2 pl-9 focus:ring-2 focus:ring-black outline-none font-mono text-lg text-black bg-white disabled:bg-gray-100 ${index > 0 && countValue !== '' && Math.abs(Number(countValue) - Number(formData.contagens[index - 1] || 0)) > (formData.usou_balanca ? 0.0025 : 0.0001) && Number(countValue) > 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} value={countValue} onChange={e => handleCountChange(index, e.target.value)} />
                        </div>
                      </div>
                    ))}
                    {!isViewMode && currentAnalysis.status === 'REVISAO' && (
                      <div className="flex items-end"><button type="button" onClick={addNextCount} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow flex items-center justify-center gap-2 text-sm transition-colors"><PlusCircle className="w-4 h-4" /> {currentAnalysis.nextAction}</button></div>
                    )}
                    {!isViewMode && currentAnalysis.status === 'INVENTARIADO' && (
                      <div className="flex items-end"><div className="w-full py-2.5 bg-green-50 text-green-800 font-bold rounded-lg border border-green-200 flex items-center justify-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-green-600" /> Validado</div></div>
                    )}
                  </div>
                </div>

                {!isViewMode && (
                  <div className="pt-6 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium bg-white">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold shadow-md">Salvar Contagem</button>
                  </div>
                )}
                {isViewMode && (
                  <div className="pt-6 flex gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium bg-white">Fechar</button></div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;