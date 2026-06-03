import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ModalDelete({ isOpen, onClose, project, deleteConfirmationText, setDeleteConfirmationText, handleDeleteProject }) {
  return (
    <AnimatePresence>
      {isOpen && project && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-[#101010] border border-red-900/50 shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-[#262626] pb-4">
              <AlertTriangle className="text-red-500 w-6 h-6" />
              <h3 className="font-serif text-2xl font-bold uppercase text-[#F2EFE9]">Excluir Projeto</h3>
            </div>
            <div className="space-y-6 mb-8">
              <p className="text-[#A3A3A3] font-mono text-xs leading-relaxed tracking-wider">Ação <span className="text-red-500 font-bold">irreversível</span>. Projeto <span className="text-[#F2EFE9] font-bold">"{project.name}"</span> será destruído.</p>
              <div className="space-y-2 text-left">
                <label className="block font-mono text-[10px] uppercase text-red-500/80 tracking-widest">Confirme o nome:</label>
                <input autoFocus type="text" value={deleteConfirmationText} onChange={(e) => setDeleteConfirmationText(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-red-500 p-3 text-[#F2EFE9] outline-none" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => { onClose(); setDeleteConfirmationText(''); }} className="flex-1 border border-[#262626] py-3 font-mono text-[10px] uppercase tracking-widest text-[#737373] hover:text-[#710CCD] hover:bg-[#262626]">Cancelar</button>
              <button onClick={handleDeleteProject} disabled={deleteConfirmationText !== project.name} className="flex-1 bg-red-900/20 text-red-500 border border-red-500/50 py-3 font-mono text-[10px] uppercase font-black hover:bg-red-500 hover:text-[#0A0A0A] disabled:opacity-30 transition-all">Exterminar</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}