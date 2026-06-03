import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, File, CheckCircle2, Search, Database, Folder, ArrowLeft, ChevronRight } from 'lucide-react';

export default function ModalManageFiles({ isOpen, onClose, project, vaultItems, managingSelectedFiles, toggleFileSelection, handleSaveManagedFiles }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);

  // Lógica de Hierarquia
  const currentFolderObj = vaultItems.find(f => f.id === currentFolder);
  const filteredItems = vaultItems.filter(item => {
    if (searchTerm) return item.type !== 'folder' && item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const itemParent = item.parent_id || item.parentId || null;
    return itemParent === currentFolder;
  });

  const handleBack = () => {
    if (currentFolderObj) {
      setCurrentFolder(currentFolderObj.parent_id || currentFolderObj.parentId || null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && project && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-[#101010] border border-[#262626] shadow-2xl flex flex-col h-[650px]">
            
            <div className="p-6 border-b border-[#262626] flex justify-between items-center bg-[#0A0A0A]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#262626] flex items-center justify-center rounded-sm"><Database className="text-[#A3A3A3]" size={20} /></div>
                <div>
                  <h3 className="font-serif text-xl font-bold uppercase text-[#F2EFE9]">Base Contextual do Nó</h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-plan)]">Editando arquivos para: {project.name}</p>
                </div>
              </div>
              <button onClick={() => { setSearchTerm(''); setCurrentFolder(null); onClose(); }} className="text-[#525252] hover:text-[#710CCD]"><X size={20} /></button>
            </div>

            <div className="p-6 border-b border-[#262626] bg-[#050505]">
              <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#262626] p-3 focus-within:border-[var(--color-plan)] transition-colors">
                <Search size={16} className="text-[#525252]" />
                <input autoFocus type="text" placeholder="Pesquisar em todo o cofre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-[#F2EFE9] font-sans text-sm w-full" />
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">{filteredItems.length} Encontrado(s)</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-plan)] bg-[var(--color-plan-10)] px-3 py-1 font-bold">{managingSelectedFiles.length} Conectado(s)</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-[#050505]">
              {!searchTerm && currentFolder && (
                <div onClick={handleBack} className="flex items-center gap-3 p-3 mb-2 bg-[#101010] border border-[#262626] cursor-pointer hover:border-[var(--color-plan)] transition-colors text-[#A3A3A3] hover:text-[var(--color-plan)]">
                  <ArrowLeft size={14} />
                  <span className="font-mono text-[10px] uppercase tracking-widest font-bold">Voltar para {currentFolderObj?.name || 'Pasta Anterior'}</span>
                </div>
              )}

              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-[#525252] font-mono text-xs uppercase tracking-widest flex flex-col items-center gap-2"><Search size={24} className="opacity-30" />Pasta vazia ou nenhum arquivo encontrado.</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredItems.map(item => {
                    if (item.type === 'folder') {
                      return (
                        <div key={item.id} onClick={() => setCurrentFolder(item.id)} className="flex items-center gap-4 p-4 cursor-pointer bg-[#0A0A0A] border border-[#262626] hover:border-[#525252] transition-all group">
                          <Folder size={16} className="text-[var(--color-plan)] group-hover:scale-110 transition-transform" />
                          <span className="font-sans text-sm text-[#F2EFE9] font-bold truncate flex-1">{item.name}</span>
                          <ChevronRight size={14} className="text-[#525252] group-hover:text-[#710CCD]" />
                        </div>
                      );
                    }
                    const isSelected = managingSelectedFiles.includes(item.id);
                    return (
                      <div key={item.id} onClick={() => toggleFileSelection(item.id, 'manage')} className={`flex items-center gap-4 p-4 cursor-pointer transition-all border ${isSelected ? 'bg-[var(--color-plan-05)] border-[var(--color-plan-50)]' : 'bg-[#101010] border-[#262626] hover:border-[#525252]'}`}>
                        <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${isSelected ? 'border-[var(--color-plan)] bg-[var(--color-plan)]' : 'border-[#525252] bg-[#0A0A0A]'}`}>
                          {isSelected && <CheckCircle2 size={12} className="text-[#0A0A0A]" />}
                        </div>
                        <File size={16} className={isSelected ? 'text-[var(--color-plan)]' : 'text-[#525252]'} />
                        <span className={`font-sans text-sm truncate flex-1 ${isSelected ? 'text-[#F2EFE9] font-bold' : 'text-[#A3A3A3]'}`}>{item.name}</span>
                        <span className={`font-mono text-[8px] uppercase tracking-widest ${isSelected ? 'text-[var(--color-plan)]' : 'text-[#525252]'}`}>{isSelected ? 'Injetado' : 'Ignorado'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#262626] flex justify-end bg-[#0A0A0A] gap-4">
              <button onClick={() => { setSearchTerm(''); setCurrentFolder(null); onClose(); }} className="px-6 py-3 font-mono text-xs uppercase tracking-widest text-[#737373] hover:text-[#710CCD] transition-colors">Cancelar</button>
              <button onClick={() => { setSearchTerm(''); setCurrentFolder(null); handleSaveManagedFiles(); }} className="bg-[var(--color-plan)] text-[#0A0A0A] px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-[#710CCD] transition-colors flex items-center gap-2"><Save size={14} /> Atualizar Conexões</button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}