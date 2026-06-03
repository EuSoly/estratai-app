import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, X, Search, ArrowLeft, Loader2, Folder, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../../supabaseClient';

export default function FileExplorerModal({ projectId, onClose, onLinkFile, linkedFileIds = [] }) {
  const [modalItems, setModalItems] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderHistory, setFolderHistory] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchExplorerItems();
  }, [currentFolderId, debouncedSearchQuery, projectId, linkedFileIds]);

  const fetchExplorerItems = async () => {
    try {
      setModalLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !projectId) return;

      let query = supabase.from('vault_items').select('*').eq('user_id', user.id);

      if (debouncedSearchQuery.trim() !== '') {
        query = query.ilike('name', `%${debouncedSearchQuery}%`);
      } else {
        if (currentFolderId) query = query.eq('parent_id', currentFolderId);
        else query = query.is('parent_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      const filteredItems = (data || []).filter(item => !linkedFileIds.includes(item.id));
      setModalItems(filteredItems);
    } catch (err) {
      console.error("❌ Erro ao listar itens do cofre:", err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenFolder = (folder) => {
    setFolderHistory(prev => [...prev, currentFolderId]);
    setCurrentFolderId(folder.id);
  };

  const handleGoBack = () => {
    if (folderHistory.length === 0) return;
    const previous = [...folderHistory];
    const lastId = previous.pop();
    setFolderHistory(previous);
    setCurrentFolderId(lastId);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop Brutalista */}
      <div className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur-sm" onClick={onClose} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-[#0A0A0A] border border-[#262626] flex flex-col max-h-[80vh] shadow-2xl"
      >
        {/* Header HUD */}
        <div className="p-4 border-b border-[#262626] bg-[#101010] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link2 size={16} className="text-[var(--color-plan)]" />
            <h3 className="font-serif text-sm font-black uppercase text-[#F2EFE9] tracking-wider">Injetar Contexto Estratégico</h3>
          </div>
          <button onClick={onClose} className="text-[#525252] hover:text-red-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Barra de Busca e Navegação */}
        <div className="p-4 border-b border-[#262626] bg-[#0A0A0A] flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-[#101010] border border-[#262626] px-3 py-2">
            <Search size={14} className="text-[#525252]" />
            <input 
              type="text"
              placeholder="Pesquisar arquivos no cofre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs font-mono text-[#F2EFE9] outline-none placeholder-[#525252] w-full uppercase"
            />
          </div>

          {folderHistory.length > 0 && searchQuery === '' && (
            <button 
              onClick={handleGoBack}
              className="px-4 py-2 border border-[#262626] bg-[#101010] text-[#A3A3A3] hover:text-[#710CCD] font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
            >
              <ArrowLeft size={12} /> Voltar Nível
            </button>
          )}
        </div>

        {/* Lista de Arquivos Centralizada */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#050505]">
          {modalLoading ? (
            <div className="h-48 flex items-center justify-center font-mono text-xs text-[#737373] uppercase tracking-widest gap-2">
              <Loader2 size={14} className="animate-spin text-[var(--color-plan)]" /> Escaneando Diretórios Neurais...
            </div>
          ) : modalItems.length > 0 ? (
            modalItems.map(item => {
              const isFolder = item.type === 'folder';
              // 🔥 Verifica em tempo real se o arquivo já está linkado neste projeto
              const isLinked = linkedFileIds.includes(item.id);

              return (
                <div key={item.id} className="p-3 bg-[#101010] border border-[#262626] flex items-center justify-between hover:border-[#525252] transition-colors">
                  <div className="flex items-center gap-3 truncate flex-1 mr-4">
                    {isFolder ? <Folder size={16} className="text-[var(--color-plan)] flex-shrink-0" /> : <FileText size={16} className="text-[#525252] flex-shrink-0" />}
                    <div className="flex flex-col truncate">
                      <span className="font-mono text-xs text-[#F2EFE9] truncate">{item.name}</span>
                      <span className="font-mono text-[8px] text-[#525252] uppercase tracking-wider">
                        {isFolder ? 'DIRETÓRIO / PASTA' : `${item.type || 'DOC'} // ${item.size || '0.0 MB'}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {isFolder ? (
                      <button 
                        onClick={() => handleOpenFolder(item)}
                        className="px-4 py-1.5 bg-[#262626] text-[#F2EFE9] hover:bg-[var(--color-plan)] hover:text-[#0A0A0A] font-mono text-[9px] uppercase font-bold transition-all"
                      >
                        Abrir Pasta
                      </button>
                    ) : (
                      <button 
                        onClick={() => !isLinked && onLinkFile(item.id)}
                        disabled={isLinked}
                        className={`px-4 py-1.5 font-mono text-[9px] uppercase font-bold border transition-all flex items-center gap-1.5 ${
                          isLinked 
                            ? 'bg-emerald-950/10 text-emerald-400 border-emerald-900/30 cursor-not-allowed' 
                            : 'bg-[#151515] text-[#F2EFE9] border-[#262626] hover:border-[var(--color-plan)] hover:text-[var(--color-plan)]'
                        }`}
                      >
                        {isLinked ? (
                          <>
                            <CheckCircle2 size={10} /> Injetado
                          </>
                        ) : (
                          'Vincular'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-32 border border-dashed border-[#262626] flex items-center justify-center font-mono text-[10px] text-[#525252] uppercase tracking-wider">
              Nenhum recurso encontrado neste diretório_
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}