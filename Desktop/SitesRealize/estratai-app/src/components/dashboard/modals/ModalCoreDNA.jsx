import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, Network, Save, File, CheckCircle2, Search, Folder, ArrowLeft } from 'lucide-react';

export default function ModalCoreDNA({ isOpen, onClose, coreData, setCoreData, vaultItems, toggleFileSelection, handleSaveCore }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);

  const currentFolderObj = vaultItems.find(f => f.id === currentFolder);
  const filteredItems = vaultItems.filter(item => {
    if (searchTerm) return item.type !== 'folder' && item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const itemParent = item.parent_id || item.parentId || null;
    return itemParent === currentFolder;
  });

  const handleBack = () => {
    if (currentFolderObj) setCurrentFolder(currentFolderObj.parent_id || currentFolderObj.parentId || null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm" />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} 
            className="relative w-full max-w-5xl bg-[#101010] border border-[var(--color-plan-50)] shadow-2xl flex flex-col h-[700px] overflow-hidden"
          >
            <div className="p-6 border-b border-[#262626] flex justify-between items-center bg-[#0A0A0A] relative overflow-hidden">
              <div className="absolute inset-0 bg-[var(--color-plan-05)]" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--color-plan-20)] border border-[var(--color-plan)] flex items-center justify-center rounded-sm"><Network className="text-[var(--color-plan)]" size={20} /></div>
                <div>
                  <h3 className="font-serif text-2xl font-bold uppercase text-[#F2EFE9]">DNA do Negócio</h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-plan)]">Matriz base de inteligência</p>
                </div>
              </div>
              <button onClick={() => { setSearchTerm(''); setCurrentFolder(null); onClose(); }} className="text-[#525252] hover:text-[#710CCD] relative z-10"><X size={20} /></button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="flex-1 p-8 border-r border-[#262626] flex flex-col bg-[#050505]">
                <label className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mb-4 flex items-center gap-2"><Database size={12} /> Diretriz Estratégica</label>
                <textarea autoFocus value={coreData.strategyText} onChange={(e) => setCoreData({...coreData, strategyText: e.target.value})} placeholder="Manifesto da marca..." className="flex-1 w-full bg-[#0A0A0A] border border-[#262626] p-4 text-[#F2EFE9] font-mono text-xs leading-relaxed outline-none focus:border-[var(--color-plan)] transition-colors resize-none" />
              </div>
              
              <div className="w-full md:w-[400px] p-6 flex flex-col bg-[#101010]">
                <div className="flex justify-between items-end mb-4">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-[#737373] flex items-center gap-2"><File size={12} /> Base Documental Global</label>
                  <span className="font-mono text-[9px] uppercase text-[var(--color-plan)] bg-[var(--color-plan-10)] px-2 py-1">{coreData.linkedFiles.length} Conectado(s)</span>
                </div>

                <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#262626] p-2 mb-3 focus-within:border-[var(--color-plan)] transition-colors">
                  <Search size={14} className="text-[#525252]" />
                  <input type="text" placeholder="Buscar no cofre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-[#F2EFE9] font-sans text-xs w-full" />
                </div>

                <div className="flex-1 border border-[#262626] bg-[#0A0A0A] overflow-y-auto p-2">
                  {!searchTerm && currentFolder && (
                    <div onClick={handleBack} className="flex items-center gap-3 p-3 mb-2 bg-[#101010] border border-[#262626] cursor-pointer hover:border-[var(--color-plan)] text-[#A3A3A3] hover:text-[var(--color-plan)]">
                      <ArrowLeft size={14} /> <span className="font-mono text-[10px] uppercase font-bold">Voltar ({currentFolderObj?.name})</span>
                    </div>
                  )}

                  {filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-[#525252] font-mono text-xs uppercase">Vazio.</div>
                  ) : (
                    filteredItems.map(item => {
                      if (item.type === 'folder') {
                        return (
                          <div key={item.id} onClick={() => setCurrentFolder(item.id)} className="flex items-center gap-3 p-3 cursor-pointer border-b border-[#262626] hover:bg-[#101010]">
                            <Folder size={14} className="text-[var(--color-plan)]" /> <span className="font-sans text-xs text-[#F2EFE9] truncate flex-1">{item.name}</span>
                          </div>
                        );
                      }
                      const isSelected = coreData.linkedFiles.includes(item.id);
                      return (
                        <div key={item.id} onClick={() => toggleFileSelection(item.id, 'core')} className={`flex items-center gap-3 p-3 cursor-pointer border-b border-[#262626] ${isSelected ? 'bg-[var(--color-plan-05)] border-l-2 border-l-[var(--color-plan)]' : 'hover:bg-[#101010]'}`}>
                          <div className={`w-3 h-3 border flex items-center justify-center ${isSelected ? 'border-[var(--color-plan)] bg-[var(--color-plan)]' : 'border-[#525252]'}`}>{isSelected && <CheckCircle2 size={10} className="text-[#0A0A0A]" />}</div>
                          <span className={`font-sans text-xs truncate flex-1 ${isSelected ? 'text-[#F2EFE9] font-bold' : 'text-[#A3A3A3]'}`}>{item.name}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#262626] flex justify-end bg-[#0A0A0A]">
              <button onClick={() => { setSearchTerm(''); setCurrentFolder(null); handleSaveCore(); }} className="bg-[var(--color-plan)] text-[#0A0A0A] px-8 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-[#710CCD] transition-colors flex items-center gap-2">
                <Save size={14} /> Gravar DNA
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}