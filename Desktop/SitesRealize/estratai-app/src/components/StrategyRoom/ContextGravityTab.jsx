import React, { useState, useEffect, useRef } from 'react';
import { usePlanColor } from '../../contexts/PlanContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Target, CheckCircle2, XCircle, BrainCircuit, Loader2, 
  RefreshCw, Plus, Link2, X, Folder, ChevronRight, ArrowLeft, 
  Trash2, Edit3, Type, Palette, Layout, Search, Eye, Sliders
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function ContextGravityTab({ projectId }) {
  const planColor = usePlanColor();
  const containerRef = useRef(null);
  
  // Estados Principais da Órbita
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [nodeContextMenu, setNodeContextMenu] = useState(null);
  const [editingFile, setEditingFile] = useState(null);

  // Estados do Modal do Explorador de Arquivos (Nativo)
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [modalItems, setModalItems] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderHistory, setFolderHistory] = useState([]); // Histórico de navegação (Breadcrumbs)
  const [modalLoading, setModalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const maxOrbit = 350; // Raio de gravidade física

  // Dicionário Dinâmico de Ícones Selecionáveis
  const iconLibrary = {
    file: FileText,
    brain: BrainCircuit,
    target: Target,
    eye: Eye
  };

  // Paleta Industrial de Cores Customizáveis para os Ficheiros
  const colorLibrary = [
    { name: 'Laranja Industrial', hex: '#842CD5' },
    { name: 'Verde Suporte', hex: '#10B981' },
    { name: 'Vermelho Crítico', hex: '#EF4444' },
    { name: 'Azul Corporativo', hex: '#3B82F6' },
    { name: 'Branco Osso', hex: '#F2EFE9' },
    { name: 'Cinza Mudo', hex: '#737373' }
  ];

  // --- BUSCA ARQUIVOS ATIVOS DO PROJETO ---
  const fetchProjectFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vault_items')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      // Algoritmo de dispersão para novos nós sem coordenadas gravadas
      const mapped = data.map((file, index) => {
        if (file.x === 0 && file.y === 0) {
          const angle = (index / data.length) * 2 * Math.PI;
          const radius = 140 + Math.random() * 90;
          return {
            ...file,
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            weight: file.weight || 50,
            intent: file.intent || 'neutral',
            custom_icon: file.custom_icon || 'file',
            custom_color: file.custom_color || '#842CD5'
          };
        }
        return file;
      });
      setFiles(mapped);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- NAVEGADOR DO EXPLORADOR DE ARQUIVOS (MODAL SUPABASE) ---
  const fetchExplorerItems = async () => {
    try {
      setModalLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('vault_items')
        .select('*')
        .eq('user_id', user?.id);

      // Se houver texto na busca, filtra globalmente. Caso contrário, respeita a pasta atual
      if (searchQuery.trim() !== '') {
        query = query.ilike('name', `%${searchQuery}%`);
      } else {
        if (currentFolderId) {
          query = query.eq('parent_id', currentFolderId);
        } else {
          query = query.is('parent_id', null);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setModalItems(data || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => { if (projectId) fetchProjectFiles(); }, [projectId]);
  useEffect(() => { if (showLinkModal) fetchExplorerItems(); }, [currentFolderId, showLinkModal, searchQuery]);

  // Navegar para dentro de uma subpasta
  const handleOpenFolder = (folder) => {
    setFolderHistory(prev => [...prev, folder]);
    setCurrentFolderId(folder.id);
    setSearchQuery(''); // Limpa a busca ao navegar por pastas
  };

  // Voltar um nível na árvore de diretórios
  const handleNavigateBack = () => {
    const updatedHistory = [...folderHistory];
    updatedHistory.pop();
    setFolderHistory(updatedHistory);
    const parentFolder = updatedHistory[updatedHistory.length - 1];
    setCurrentFolderId(parentFolder ? parentFolder.id : null);
  };

  // --- PERSISTÊNCIA GEOMÉTRICA (DRAG END) ---
  const handleDragEnd = async (id, info) => {
    const target = files.find(f => f.id === id);
    if (!target) return;

    const newX = target.x + info.offset.x;
    const newY = target.y + info.offset.y;
    const distance = Math.sqrt(newX * newX + newY * newY);

    let newWeight = 100 - (distance / maxOrbit) * 100;
    newWeight = Math.max(5, Math.min(100, Math.round(newWeight)));

    setFiles(prev => prev.map(f => f.id === id ? { ...f, x: newX, y: newY, weight: newWeight } : f));

    await supabase
      .from('vault_items')
      .update({ x: newX, y: newY, weight: newWeight })
      .eq('id', id);
  };

  // --- MÓDULO DE CLASSIFICAÇÃO E CUSTOMIZAÇÃO ---
  const handleSaveFileEdits = async (e) => {
    e.preventDefault();
    if (!editingFile) return;

    // Atualização otimista
    setFiles(prev => prev.map(f => f.id === editingFile.id ? editingFile : f));

    const { error } = await supabase
      .from('vault_items')
      .update({
        name: editingFile.name,
        intent: editingFile.intent,
        custom_icon: editingFile.custom_icon,
        custom_color: editingFile.custom_color
      })
      .eq('id', editingFile.id);

    if (!error) {
      setEditingFile(null);
      fetchProjectFiles();
    }
  };

  // Vincular arquivo à órbita
  const linkFileToProject = async (fileId) => {
    const angle = Math.random() * 2 * Math.PI;
    const startX = Math.cos(angle) * 180;
    const startY = Math.sin(angle) * 180;

    await supabase
      .from('vault_items')
      .update({ project_id: projectId, x: startX, y: startY, weight: 50, intent: 'neutral' })
      .eq('id', fileId);

    fetchProjectFiles();
    fetchExplorerItems();
  };

  // Desvincular da órbita (Deletar da visualização molecular)
  const unlinkFile = async (id) => {
    await supabase
      .from('vault_items')
      .update({ project_id: null, x: 0, y: 0, weight: 50, intent: 'neutral' })
      .eq('id', id);
    
    setFiles(prev => prev.filter(f => f.id !== id));
    setNodeContextMenu(null);
  };

  // Fechar menus de contexto ao clicar fora
  useEffect(() => {
    const closeAll = () => setNodeContextMenu(null);
    window.addEventListener('click', closeAll);
    return () => window.removeEventListener('click', closeAll);
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-[500px] bg-[#0A0A0A] border border-[#262626] flex flex-col items-center justify-center gap-3">
        <Loader2 className="text-[var(--color-plan)] animate-spin" size={24} />
        <span className="font-mono text-xs text-[#737373] uppercase tracking-widest">Sincronizando Nós Supabase...</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full min-h-[700px] bg-[#0A0A0A] border border-[#262626] overflow-hidden relative">
      
      {/* HEADER SUPERIOR */}
      <div className="absolute top-0 left-0 w-full p-6 flex flex-col sm:flex-row sm:items-start justify-between z-30 pointer-events-none gap-4">
        <div>
          <h2 className="text-[#F2EFE9] font-serif text-2xl font-black uppercase flex items-center gap-2">
            <BrainCircuit className="text-[var(--color-plan)]" /> Topologia de Nós Orbitais
          </h2>
          <p className="text-[#737373] font-mono text-xs mt-2 max-w-md">
            Passe o mouse sobre os nós para revelar metadados. Clique com o botão direito para configurar ou deletar os satélites de dados.
          </p>
        </div>
        
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowLinkModal(true)}
            className="px-4 py-3 bg-[#101010] border border-[#262626] text-[#F2EFE9] font-mono text-xs uppercase tracking-widest hover:border-[var(--color-plan)] hover:text-[var(--color-plan)] transition-all flex items-center gap-2"
          >
            <Plus size={14} /> Vincular Arquivos
          </button>
          <button onClick={fetchProjectFiles} className="p-3 bg-[#101010] border border-[#262626] text-[#737373] hover:text-[#710CCD] transition-all">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ARENA GRÁFICA DE GRAVIDADE */}
      <div ref={containerRef} onContextMenu={e => e.preventDefault()} className="flex-1 w-full h-full min-h-[620px] relative flex items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#121212] to-[#0A0A0A]">
        
        {/* Vetores das Órbitas */}
        <div className="absolute w-[700px] h-[700px] border border-dashed border-[#262626] rounded-full opacity-10" />
        <div className="absolute w-[450px] h-[450px] border border-dashed border-[#262626] rounded-full opacity-25" />
        <div className="absolute w-[200px] h-[200px] border border-[#262626] rounded-full opacity-40 bg-[#101010]/10 backdrop-blur-xs" />

        {/* NÚCLEO DO PROJETO */}
        <div className="absolute z-10 w-20 h-20 bg-[#0A0A0A] border border-[var(--color-plan)] rounded-full flex items-center justify-center" style={{ boxShadow: `0 0 40px ${planColor.bg}` }}>
          <div className="w-14 h-14 border border-dashed border-[var(--color-plan-20)] rounded-full absolute animate-spin-slow" />
          <Target size={18} className="text-[var(--color-plan)]" />
        </div>

        {files.length === 0 && (
          <div className="absolute z-20 font-mono text-[10px] text-[#525252] uppercase tracking-widest text-center pointer-events-none">
            Órbita Vazia. Vincule documentos para iniciar a malha de contexto.
          </div>
        )}

        {/* RENDERIZAÇÃO DE NÓS DE ÍCONES PUROS */}
        {files.map((file) => {
          const NodeIcon = iconLibrary[file.custom_icon || 'file'] || FileText;
          
          // Estilo da borda com base na classificação de inteligência
          const borderClass = file.intent === 'good' 
            ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
            : file.intent === 'bad' 
            ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
            : 'border-[#262626]';

          return (
            <motion.div
              key={file.id}
              drag dragMomentum={false} dragConstraints={containerRef}
              initial={{ x: file.x, y: file.y }}
              onDragEnd={(e, info) => handleDragEnd(file.id, info)}
              onContextMenu={(e) => {
                e.preventDefault(); e.stopPropagation();
                const bounds = containerRef.current.getBoundingClientRect();
                setNodeContextMenu({
                  x: e.clientX - bounds.left,
                  y: e.clientY - bounds.top,
                  fileId: file.id
                });
              }}
              className="absolute z-20 cursor-grab active:cursor-grabbing group"
            >
              {/* O Nó Geométrico Premium */}
              <div 
                className={`w-11 h-11 bg-[#0A0A0A] border flex items-center justify-center relative transition-colors ${borderClass}`}
                style={{ color: file.custom_color }}
              >
                <NodeIcon size={16} />
                
                {/* Minibarra de porcentagem gravitacional interna */}
                <div className="absolute bottom-0 left-0 h-[2px] bg-[var(--color-plan)] transition-all" style={{ width: `${file.weight}%` }} />
              </div>

              {/* TOOLTIP INDUSTRIAL AUTOMÁTICO (REVELAÇÃO NO HOVER) */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-14 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                <div className="bg-[#101010] border border-[#262626] px-3 py-1.5 whitespace-nowrap shadow-2xl flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#F2EFE9]">{file.name}</span>
                  <span className="font-mono text-[9px] text-[var(--color-plan)] font-bold">[{file.weight}%]</span>
                </div>
                <div className="w-1.5 h-1.5 bg-[#101010] border-r border-b border-[#262626] rotate-45 -mt-1" />
              </div>

            </motion.div>
          );
        })}

        {/* CUSTOM CONTEXT MENU (BOTÃO DIREITO NOS ARQUIVOS) */}
        <AnimatePresence>
          {nodeContextMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ top: nodeContextMenu.y, left: nodeContextMenu.x }}
              className="absolute z-50 bg-[#0A0A0A] border border-[#262626] w-44 py-1 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  const target = files.find(f => f.id === nodeContextMenu.fileId);
                  setEditingFile({ ...target });
                  setNodeContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left font-mono text-[10px] text-[#F2EFE9] hover:bg-[#101010] hover:text-[var(--color-plan)] uppercase tracking-widest flex items-center gap-2.5 transition-colors"
              >
                <Sliders size={12} /> Configurar Nó
              </button>
              <div className="h-px bg-[#262626] my-1 mx-2" />
              <button
                onClick={() => unlinkFile(nodeContextMenu.fileId)}
                className="w-full px-4 py-2 text-left font-mono text-[10px] text-red-500 hover:bg-red-950/20 uppercase tracking-widest flex items-center gap-2.5 transition-colors"
              >
                <Trash2 size={12} /> Desvincular
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL CONFIGURAÇÃO COMPLETA DO ARQUIVO (EDITAR NOME/ÍCONE/COR/INTENT) */}
      <AnimatePresence>
        {editingFile && (
          <div className="fixed inset-0 bg-[#0A0A0A]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.form
              onSubmit={handleSaveFileEdits}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-md bg-[#0A0A0A] border border-[#262626] p-6 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-[#262626] pb-4">
                <span className="font-mono text-xs text-[#F2EFE9] uppercase tracking-widest font-bold flex items-center gap-2">
                  <Layout size={14} className="text-[var(--color-plan)]" /> Parametrização do Satélite
                </span>
                <button type="button" onClick={() => setEditingFile(null)} className="text-[#737373] hover:text-[#710CCD]"><X size={16} /></button>
              </div>

              {/* Input de Nome */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-[#525252] uppercase tracking-wider flex items-center gap-1.5"><Type size={11} /> Nome Corporativo</label>
                <input 
                  type="text" required value={editingFile.name}
                  onChange={e => setEditingFile({ ...editingFile, name: e.target.value })}
                  className="w-full bg-[#101010] border border-[#262626] text-[#F2EFE9] font-mono text-xs p-2.5 outline-none focus:border-[var(--color-plan)]"
                />
              </div>

              {/* Seletor de Ícones */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-[#525252] uppercase tracking-wider flex items-center gap-1.5"><Layout size={11} /> Vetor Visual (Ícone)</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(iconLibrary).map(iconName => {
                    const TargetIcon = iconLibrary[iconName];
                    const isSelected = editingFile.custom_icon === iconName;
                    return (
                      <button
                        key={iconName} type="button"
                        onClick={() => setEditingFile({ ...editingFile, custom_icon: iconName })}
                        className={`p-3 border transition-all flex justify-center ${isSelected ? 'border-[var(--color-plan)] bg-[var(--color-plan-10)] text-[var(--color-plan)]' : 'border-[#262626] text-[#737373] hover:text-[#710CCD]'}`}
                      >
                        <TargetIcon size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seletor de Cores */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-[#525252] uppercase tracking-wider flex items-center gap-1.5"><Palette size={11} /> Vetor Térmico (Cor)</label>
                <div className="flex flex-wrap gap-2">
                  {colorLibrary.map(color => {
                    const isSelected = editingFile.custom_color === color.hex;
                    return (
                      <button
                        key={color.hex} type="button" onClick={() => setEditingFile({ ...editingFile, custom_color: color.hex })}
                        className="w-6 h-6 relative flex items-center justify-center group" style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {isSelected && <div className="w-2 h-2 bg-[#0A0A0A] rounded-full" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Classificação de Inteligência (Intent) */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-[#525252] uppercase tracking-wider flex items-center gap-1.5"><BrainCircuit size={11} /> Classificação Contextual (IA)</label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'neutral', label: 'Arquivo Base (Consulta Padrão)', color: 'text-[#737373]' },
                    { id: 'good', label: 'Exemplo de Sucesso (Benchmark)', color: 'text-emerald-400' },
                    { id: 'bad', label: 'Anti-Padrão (O que NÃO fazer)', color: 'text-red-400' }
                  ].map(opt => (
                    <label 
                      key={opt.id} 
                      className={`p-3 border flex items-center gap-3 cursor-pointer select-none transition-all ${editingFile.intent === opt.id ? 'border-[var(--color-plan)] bg-[var(--color-plan-05)]' : 'border-[#262626]'}`}
                    >
                      <input 
                        type="radio" name="intentOption" checked={editingFile.intent === opt.id}
                        onChange={() => setEditingFile({ ...editingFile, intent: opt.id })}
                        className="accent-[var(--color-plan)]"
                      />
                      <span className={`font-mono text-xs ${opt.color}`}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ações Inferiores */}
              <div className="flex justify-end gap-2 border-t border-[#262626] pt-4">
                <button type="button" onClick={() => setEditingFile(null)} className="px-4 py-2 border border-[#262626] font-mono text-[10px] uppercase text-[#737373] hover:text-[#710CCD]">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[var(--color-plan)] text-[#0A0A0A] font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-[#710CCD] transition-colors">Salvar Parâmetros</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PADRÃO DE EXPLORADOR DE ARQUIVOS (DIRETÓRIOS E PASTAS REAL) */}
      <AnimatePresence>
        {showLinkModal && (
          <div className="fixed inset-0 bg-[#0A0A0A]/90 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-2xl bg-[#0A0A0A] border border-[#262626] flex flex-col h-[550px]"
            >
              {/* Header Explorador */}
              <div className="p-4 border-b border-[#262626] flex justify-between items-center bg-[#050505]">
                <div className="flex items-center gap-3">
                  <Link2 className="text-[var(--color-plan)]" size={16} />
                  <span className="font-mono text-xs text-[#F2EFE9] uppercase tracking-widest font-bold">Cofre de Contexto Global</span>
                </div>
                <button onClick={() => { setShowLinkModal(false); setCurrentFolderId(null); setFolderHistory([]); setSearchQuery(''); }} className="text-[#737373] hover:text-[#710CCD]"><X size={16} /></button>
              </div>

              {/* Barra de Pesquisa Integrada */}
              <div className="p-3 border-b border-[#262626] bg-[#0A0A0A] flex items-center gap-3">
                <div className="flex-1 bg-[#101010] border border-[#262626] px-3 py-2 flex items-center gap-2">
                  <Search size={14} className="text-[#525252]" />
                  <input 
                    type="text" placeholder="PESQUISAR ARQUIVO POR NOME..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none font-mono text-xs text-[#F2EFE9] w-full placeholder-[#525252]"
                  />
                </div>
              </div>

              {/* Barra de Caminho Atual / Breadcrumbs */}
              {searchQuery.trim() === '' && (
                <div className="px-4 py-2.5 bg-[#050505] border-b border-[#262626] flex items-center gap-2 font-mono text-[10px] text-[#737373] uppercase">
                  {folderHistory.length > 0 && (
                    <button onClick={handleNavigateBack} className="mr-2 p-1 border border-[#262626] bg-[#101010] hover:text-[#710CCD] flex items-center gap-1"><ArrowLeft size={10} /> Voltar</button>
                  )}
                  <span className={currentFolderId === null ? 'text-[var(--color-plan)] font-bold' : 'cursor-pointer hover:text-[#710CCD]'} onClick={() => { setCurrentFolderId(null); setFolderHistory([]); }}>Raiz</span>
                  {folderHistory.map((fold, idx) => (
                    <React.Fragment key={fold.id}>
                      <ChevronRight size={10} />
                      <span className={idx === folderHistory.length - 1 ? 'text-[var(--color-plan)] font-bold' : ''}>{fold.name}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Listagem de Pastas e Arquivos */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#050505]/40">
                {modalLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="text-[var(--color-plan)] animate-spin" size={20} />
                    <span className="font-mono text-[9px] text-[#525252] uppercase">Estruturando Diretório...</span>
                  </div>
                ) : modalItems.length === 0 ? (
                  <div className="py-20 text-center font-mono text-xs text-[#525252] uppercase tracking-wider">Nenhuma pasta ou arquivo localizado neste nível.</div>
                ) : (
                  modalItems.map((item) => {
                    const isFolder = item.type === 'folder';
                    const isLinkedToCurrent = item.project_id === projectId;

                    return (
                      <div 
                        key={item.id}
                        className="p-2.5 bg-[#101010] border border-[#262626] flex items-center justify-between hover:border-[#525252] transition-colors"
                      >
                        <div className="flex items-center gap-3 truncate flex-1">
                          {isFolder ? (
                            <Folder size={16} className="text-[var(--color-plan)]" />
                          ) : (
                            <FileText size={16} className="text-[#525252]" />
                          )}
                          <div className="flex flex-col truncate">
                            <span className="font-mono text-xs text-[#F2EFE9] truncate">{item.name}</span>
                            <span className="font-mono text-[8px] text-[#525252] uppercase">{isFolder ? 'DIRETÓRIO / PASTA' : (item.type || 'DOCUMENTO')}</span>
                          </div>
                        </div>

                        <div>
                          {isFolder ? (
                            <button
                              onClick={() => handleOpenFolder(item)}
                              className="px-3 py-1.5 bg-[#262626] text-[#F2EFE9] hover:bg-[var(--color-plan)] hover:text-[#0A0A0A] font-mono text-[9px] uppercase font-bold transition-colors"
                            >
                              Abrir Pasta
                            </button>
                          ) : (
                            <button
                              onClick={() => !isLinkedToCurrent && linkFileToProject(item.id)}
                              disabled={isLinkedToCurrent}
                              className={`px-3 py-1.5 font-mono text-[9px] uppercase font-bold transition-colors ${isLinkedToCurrent ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 cursor-not-allowed' : 'bg-[#262626] text-[#F2EFE9] hover:bg-[var(--color-plan)] hover:text-[#0A0A0A]'}`}
                            >
                              {isLinkedToCurrent ? 'Já Vinculado' : 'Vincular Nó'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}