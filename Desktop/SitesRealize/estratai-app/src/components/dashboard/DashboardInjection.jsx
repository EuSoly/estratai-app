import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useDataCache } from '../../hooks/useDataCache';
import config from '../../config/env';
import {
  UploadCloud, File, FolderPlus, Search,
  Edit2, Trash2, ArrowUpDown,
  Folder, ArrowLeft, X, AlertTriangle, Info, MoveRight, CheckSquare, Square, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardInjection() {
  const cache = useDataCache();
  const cachedVaultItems = cache.getVaultItems();

  const [items, setItems] = useState(() => cachedVaultItems?.data || []);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [sortConfig, setSortOrder] = useState({ key: 'date', direction: 'desc' });
  const [modalType, setModalType] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    const cached = cache.getVaultItems();

    // Se tem cache válido, usa direto
    if (cached?.data && cached.data.length > 0) {
      setItems(cached.data);
      return;
    }

    // Senão, valida e fetch se necessário
    (async () => {
      const shouldFetch = await validateVaultItemsTimestamp();
      if (shouldFetch) {
        await fetchVaultItems();
      }
    })();
  }, [cachedVaultItems]);

  const validateVaultItemsTimestamp = async () => {
    if (!cachedVaultItems?.latestUpdate) return true;

    try {
      const { data, error } = await supabase
        .from('vault_items')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data?.[0]) return true;
      return data[0].created_at !== cachedVaultItems.latestUpdate;
    } catch {
      return true;
    }
  };

  const fetchVaultItems = async () => {
    const { data, error } = await supabase
      .from('vault_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("🔥 ERRO SUPABASE (BUSCAR DADOS):", error);
      return;
    }

    const formattedData = data.map(dbItem => ({
      id: dbItem.id,
      name: dbItem.name,
      type: dbItem.type,
      size: dbItem.size,
      parentId: dbItem.parent_id,
      date: dbItem.created_at
    }));

    setItems(formattedData);
    const latestUpdate = data?.[0]?.created_at;
    cache.setVaultItems(formattedData, latestUpdate);
  };

  // --- 2. ENGENHARIA DE RASTREAMENTO DE CAMINHO ---
  const getFolderPath = (folderId) => {
    const path = [];
    let current = items.find(i => i.id === folderId);
    while (current) {
      path.unshift(current);
      current = items.find(i => i.id === current.parentId);
    }
    return path;
  };

  const currentPath = getFolderPath(currentFolder);

  // --- 3. LÓGICA DE SELEÇÃO E GESTÃO ---
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const currentLevelIds = items.filter(i => i.parentId === currentFolder).map(i => i.id);
    const allSelected = currentLevelIds.length > 0 &&
      currentLevelIds.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : currentLevelIds);
  };

  const handleFiles = async (newFiles) => {
    const { allowedTypes, maxSizeMB } = config.fileUpload;

    const validFiles = [];
    const rejectedFiles = [];

    newFiles.forEach(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      const sizeMB = file.size / (1024 * 1024);

      if (allowedTypes.includes(extension) && sizeMB <= maxSizeMB) {
        validFiles.push(file);
      } else {
        rejectedFiles.push(file.name);
      }
    });

    if (rejectedFiles.length > 0) {
      alert(`⚠️ BLOQUEIO DE SEGURANÇA ESTRATAI\n\nOs seguintes arquivos foram bloqueados por formato não suportado ou tamanho excedido (Max ${maxSizeMB}MB):\n- ${rejectedFiles.join('\n- ')}\n\nFormatos permitidos: ${allowedTypes.join(', ').toUpperCase()}`);
    }

    if (validFiles.length === 0) return;

    // CAPTURA O USUÁRIO ATUAL LOGADO NO REACT 👇
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      alert("⚠️ Erro de Sessão: Usuário não identificado. Faça login novamente.");
      return;
    }

    // PREPARA OS DADOS E INJETA O USER_ID MANUALMENTE 👇
    const newInserts = validFiles.map(file => ({
      name: file.name,
      type: file.name.split('.').pop().toLowerCase(),
      size: file.size,
      parent_id: currentFolder,
      user_id: userId
    }));

    const { error } = await supabase.from('vault_items').insert(newInserts);

    if (error) {
      console.error("🔥 ERRO SUPABASE (UPLOAD):", error);
      alert(`Erro no banco: ${error.message}`);
    } else {
      cache.invalidateVaultItems();
      fetchVaultItems();
    }
  };

  const openModal = (type) => {
    if (selectedIds.length === 0 && type !== 'folder') return;
    setModalType(type);
    if (type === 'edit') {
      const item = items.find(i => i.id === selectedIds[0]);
      setInputValue(item.type === 'folder' ? item.name : item.name.substring(0, item.name.lastIndexOf('.')));
    } else if (type === 'move') {
      const firstItem = items.find(i => i.id === selectedIds[0]);
      setInputValue(firstItem.parentId === null ? 'root' : firstItem.parentId);
    } else {
      setInputValue('');
    }
  };

  const closeModal = () => { setModalType(null); setInputValue(''); };

  // --- 4. CRUD REAL NO SUPABASE (COM INJEÇÃO DE USER_ID) ---
  const handleAction = async () => {
    let actionError = null;

    try {
      if (modalType === 'delete') {
        const { error } = await supabase.from('vault_items').delete().in('id', selectedIds);
        actionError = error;
        
      } else if (modalType === 'edit') {
        const item = items.find(i => i.id === selectedIds[0]);
        if (!item) {
          alert("Erro: item não encontrado. Pode ter sido deletado por outro usuário.");
          return;
        }
        const finalName = item.type === 'folder' ? inputValue : `${inputValue}.${item.type}`;
        const { error } = await supabase.from('vault_items').update({ name: finalName }).eq('id', item.id);
        actionError = error;
        
      } else if (modalType === 'folder') {
        if (!inputValue) {
          alert("O sistema não detetou o nome da pasta. Tente novamente.");
          return;
        }
        
        // CAPTURA O USUÁRIO ATUAL LOGADO NO REACT 👇
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) {
          alert("⚠️ Erro de Sessão: Usuário não identificado.");
          return;
        }
        
        // INJETA O USER_ID NO CORPO DO INSERT 👇
        const { error } = await supabase.from('vault_items').insert([{ 
          name: inputValue, 
          type: 'folder', 
          parent_id: currentFolder,
          user_id: userId // Carimbado com sucesso!
        }]);
        
        actionError = error;
        
      } else if (modalType === 'move') {
        const newParentId = inputValue === 'root' ? null : inputValue;
        const { error } = await supabase.from('vault_items').update({ parent_id: newParentId }).in('id', selectedIds);
        actionError = error;
      }

      // TRATAMENTO DE ERROS CENTRALIZADO
      if (actionError) {
        console.error(`🔥 ERRO SUPABASE (${modalType.toUpperCase()}):`, actionError);
        alert(`Falha na operação:\n${actionError.message}`);
      } else {
        cache.invalidateVaultItems();
        await fetchVaultItems();
        setSelectedIds([]);
        closeModal();
      }
      
    } catch (fatalError) {
      console.error("💀 ERRO CRÍTICO NO JAVASCRIPT:", fatalError);
      alert(`Erro crítico no código: ${fatalError.message}`);
    }
  };

  // --- 5. FILTROS E EXIBIÇÃO ---
  const currentItems = items.filter(item => item.parentId === currentFolder);
  const sortedItems = [...currentItems]
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a[sortConfig.key] < b[sortConfig.key] ? (sortConfig.direction === 'asc' ? -1 : 1) : (sortConfig.direction === 'asc' ? 1 : -1);
    });

  return (
    <div className="space-y-10 relative min-h-[600px]">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl font-black uppercase text-[#F2EFE9] mb-2">Cofre de Dados.</h1>
          <p className="text-[#737373] font-mono text-sm uppercase tracking-widest text-balance max-w-lg text-left">Navegue e gerencie a sua inteligência organizacional.</p>
        </div>
        <button 
          onClick={() => openModal('folder')}
          className="border border-[#262626] bg-[#101010] p-3 text-[#A3A3A3] hover:text-[var(--color-plan)] hover:border-[var(--color-plan)] transition-all flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest"
        >
          <FolderPlus size={16} /> Nova Pasta
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(Array.from(e.dataTransfer.files)); }}
            onClick={() => fileInputRef.current?.click()}
            className={`h-full border-2 border-dashed p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${isDragging ? 'border-[var(--color-plan)] bg-[var(--color-plan-05)]' : 'border-[#262626] bg-[#101010]'}`}
          >
            <input type="file" multiple ref={fileInputRef} className="hidden" accept=".pdf,.docx,.pptx,.xlsx,.csv,.txt" onChange={(e) => handleFiles(Array.from(e.target.files))} />
            <UploadCloud className={`w-8 h-8 mb-4 ${isDragging ? 'text-[var(--color-plan)]' : 'text-[#525252]'}`} />
            <span className="font-mono text-[10px] uppercase text-[#F2EFE9] tracking-widest">Injetar novos dados</span>
          </div>
        </div>
        <div className="border border-[#262626] bg-[#101010] p-6 flex flex-col justify-center">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[#525252]" />
            <input 
              type="text" 
              placeholder="PESQUISAR..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#262626] p-3 pl-10 font-mono text-[10px] text-[#F2EFE9] outline-none focus:border-[var(--color-plan)]"
            />
          </div>
        </div>
      </div>

      <div className="border border-[#262626] bg-[#101010] overflow-hidden">
        
        {/* BARRA DE AÇÕES (SLIDE-OUT) */}
        <AnimatePresence initial={false}>
          {selectedIds.length > 0 && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-[#101010] border-b border-[#262626] overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2"><div className="w-1 h-4 bg-[var(--color-plan)]" /><span className="font-mono text-[10px] font-black uppercase text-[#F2EFE9]">{selectedIds.length} SELECIONADOS</span></div>
                  <div className="flex gap-6 items-center">
                    <button disabled={selectedIds.length !== 1} onClick={() => openModal('edit')} className="flex items-center gap-2 font-mono text-[10px] uppercase text-[#A3A3A3] hover:text-[var(--color-plan)] disabled:opacity-20"><Edit2 size={12} /> Renomear</button>
                    <button onClick={() => openModal('move')} className="flex items-center gap-2 font-mono text-[10px] uppercase text-[#A3A3A3] hover:text-[var(--color-plan)]"><MoveRight size={12} /> Mover</button>
                    <button onClick={() => openModal('delete')} className="flex items-center gap-2 font-mono text-[10px] uppercase text-[#A3A3A3] hover:text-red-500"><Trash2 size={12} /> Eliminar</button>
                  </div>
                </div>
                <button onClick={() => setSelectedIds([])} className="text-[#525252] hover:text-[#710CCD]"><X size={14} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- BREADCRUMBS DINÂMICOS DA TELA PRINCIPAL --- */}
        <div className="p-4 bg-[#0A0A0A] border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={toggleSelectAll} className="text-[#525252] hover:text-[var(--color-plan)] transition-colors">
              {selectedIds.length > 0 && selectedIds.length === currentItems.length ? <CheckSquare size={18} className="text-[var(--color-plan)]" /> : <Square size={18} />}
            </button>

            <div className="flex items-center gap-4">
              {currentFolder !== null && (
                <button 
                  onClick={() => { 
                    const current = items.find(i => i.id === currentFolder);
                    setCurrentFolder(current ? current.parentId : null); 
                    setSelectedIds([]); 
                  }}
                  className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#525252] hover:text-[var(--color-plan)] transition-colors border-r border-[#262626] pr-4"
                >
                  <ArrowLeft size={12} />
                  Voltar
                </button>
              )}

              <nav className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
                <button 
                  onClick={() => { setCurrentFolder(null); setSelectedIds([]); }}
                  className={`hover:text-[var(--color-plan)] transition-colors ${currentFolder === null ? 'text-[#F2EFE9] font-black' : 'text-[#525252]'}`}
                >
                  Raiz
                </button>
                
                {currentPath.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    <ChevronRight size={10} className="text-[#262626]" />
                    <button 
                      onClick={() => { setCurrentFolder(folder.id); setSelectedIds([]); }}
                      className={`hover:text-[var(--color-plan)] transition-colors ${index === currentPath.length - 1 ? 'text-[#F2EFE9] font-black' : 'text-[#525252]'}`}
                    >
                      {folder.name}
                    </button>
                  </React.Fragment>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#262626]">
          {sortedItems.length === 0 ? (
            <div className="p-10 text-center text-[#525252] font-mono text-xs uppercase tracking-widest">Diretório Vazio.</div>
          ) : (
            sortedItems.map((item) => (
              <div key={item.id} className={`grid grid-cols-12 p-4 items-center hover:bg-[#0A0A0A] transition-colors group ${selectedIds.includes(item.id) ? 'bg-[var(--color-plan-05)]' : ''}`}>
                <div className="col-span-1 flex items-center">
                  <button onClick={() => toggleSelect(item.id)} className={`${selectedIds.includes(item.id) ? 'text-[var(--color-plan)]' : 'text-[#262626] group-hover:text-[#525252]'} transition-colors`}>
                    {selectedIds.includes(item.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </div>
                <div className="col-span-8 flex items-center gap-4">
                  {item.type === 'folder' ? <Folder className={`${selectedIds.includes(item.id) ? 'text-[var(--color-plan)]' : 'text-[#525252]'} w-5 h-5 shrink-0`} /> : <File className="text-[#525252] w-5 h-5 shrink-0" />}
                  <span onClick={() => item.type === 'folder' && setCurrentFolder(item.id)} className={`font-sans text-sm font-bold text-[#F2EFE9] truncate ${item.type === 'folder' ? 'cursor-pointer hover:text-[var(--color-plan)] hover:underline' : ''}`}>{item.name}</span>
                </div>
                <div className="col-span-3 text-right font-mono text-[10px] text-[#525252] uppercase">{new Date(item.date).toLocaleDateString('pt-PT')}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- MODAIS COM CAMINHO COMPLETO --- */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-[#101010] border border-[#262626] p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 border-b border-[#262626] pb-4">
                {modalType === 'delete' ? <AlertTriangle className="text-red-500 w-5 h-5" /> : <Info className="text-[var(--color-plan)] w-5 h-5" />}
                <h3 className="font-serif text-xl font-bold uppercase text-[#F2EFE9]">{modalType === 'delete' ? `Eliminar ${selectedIds.length} item(s)` : modalType === 'edit' ? 'Renomear Item' : modalType === 'move' ? 'Mover item(s)' : 'Nova Pasta'}</h3>
              </div>

              <div className="mb-8">
                {modalType === 'delete' ? (
                  <p className="text-[#A3A3A3] font-mono text-xs leading-relaxed uppercase tracking-wider">Atenção: A remoção de diretórios excluirá todos os sub-arquivos recursivamente na base de dados.</p>
                ) : modalType === 'move' ? (
                  <div className="space-y-4">
                    <label className="block font-mono text-[10px] uppercase text-[#525252] tracking-widest text-left">Navegue até ao destino:</label>
                    <div className="border border-[#262626] bg-[#0A0A0A] flex flex-col h-64">
                      
                      <div className="p-3 bg-[#101010] border-b border-[#262626] flex items-center gap-3 overflow-x-auto">
                        {inputValue !== 'root' && (
                          <button
                            onClick={() => {
                              const current = items.find(i => i.id === inputValue);
                              setInputValue(current && current.parentId ? current.parentId : 'root');
                            }}
                            className="flex items-center text-[#525252] hover:text-[var(--color-plan)] transition-colors border-r border-[#262626] pr-3 shrink-0"
                          >
                            <ArrowLeft size={12} />
                          </button>
                        )}
                        <nav className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
                          <button onClick={() => setInputValue('root')} className={`font-mono text-[10px] uppercase tracking-widest hover:text-[var(--color-plan)] transition-colors ${inputValue === 'root' ? 'text-[#F2EFE9] font-black' : 'text-[#525252]'}`}>Raiz</button>
                          {inputValue !== 'root' && getFolderPath(inputValue).map((folder, index, arr) => (
                            <React.Fragment key={folder.id}>
                              <ChevronRight size={10} className="text-[#262626] shrink-0" />
                              <button onClick={() => setInputValue(folder.id)} className={`font-mono text-[10px] uppercase tracking-widest hover:text-[var(--color-plan)] transition-colors ${index === arr.length - 1 ? 'text-[#F2EFE9] font-black' : 'text-[#525252]'}`}>{folder.name}</button>
                            </React.Fragment>
                          ))}
                        </nav>
                      </div>

                      <div className="flex-1 overflow-y-auto p-2">
                        {(() => {
                          const destId = inputValue === 'root' ? null : inputValue;
                          const destItems = items.filter(i => i.parentId === destId && !selectedIds.includes(i.id));
                          
                          if (destItems.length === 0) {
                            return <div className="h-full flex items-center justify-center text-[#525252] font-mono text-[10px] uppercase tracking-widest">Diretório Vazio</div>;
                          }

                          return destItems.sort((a,b) => (a.type === 'folder' ? -1 : 1)).map(item => (
                            <div
                              key={item.id}
                              onClick={() => item.type === 'folder' && setInputValue(item.id)}
                              className={`flex items-center gap-3 p-3 transition-colors ${item.type === 'folder' ? 'cursor-pointer hover:bg-[#101010] text-[#F2EFE9]' : 'opacity-40 text-[#737373] cursor-default'}`}
                            >
                              {item.type === 'folder' ? <Folder size={14} className="text-[var(--color-plan)] shrink-0" /> : <File size={14} className="text-[#525252] shrink-0" />}
                              <span className="font-sans text-xs truncate">{item.name}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-left">
                    <label className="block font-mono text-[10px] uppercase text-[#525252] tracking-widest">Identificação do Registo</label>
                    <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#262626] p-3 focus-within:border-[var(--color-plan)] transition-colors">
                      <input autoFocus type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAction()} className="bg-transparent border-none outline-none text-[#F2EFE9] font-sans text-sm w-full" />
                      {modalType === 'edit' && items.find(i => i.id === selectedIds[0])?.type !== 'folder' && <span className="font-mono text-[10px] text-[#525252]">.{items.find(i => i.id === selectedIds[0])?.type}</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button onClick={closeModal} className="flex-1 border border-[#262626] py-3 font-mono text-[10px] uppercase tracking-widest text-[#737373] hover:text-[#710CCD] hover:bg-[#262626]">Cancelar</button>
                <button onClick={handleAction} className={`flex-1 py-3 font-mono text-[10px] uppercase tracking-widest font-black ${modalType === 'delete' ? 'bg-red-900/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-[#0A0A0A]' : 'bg-[var(--color-plan)] text-[#0A0A0A]'}`}>{modalType === 'move' ? 'Mover para cá' : 'Executar'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}