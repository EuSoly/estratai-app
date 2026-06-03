import React from 'react';
import { BrainCircuit, Plus, RefreshCw } from 'lucide-react';

export default function GravityHeader({ onOpenLinkModal, onRefresh, filesCount }) {
  return (
    <div className="absolute top-0 left-0 w-full p-6 flex flex-col md:flex-row md:items-start justify-between z-30 pointer-events-none gap-4">
      {/* Título */}
      <div>
        <h2 className="text-[#F2EFE9] font-serif text-2xl font-black uppercase flex items-center gap-2">
          <BrainCircuit className="text-[var(--color-plan)]" /> Topologia de Arquivos
        </h2>
        <p className="text-[#737373] font-mono text-xs mt-2 max-w-md">
          Arraste os arquivos livremente. Quanto mais próximo do centro, maior a influência no projeto.
          Clique com o botão direito para configurar ou desvincular.
        </p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onOpenLinkModal}
          className="px-4 py-3 bg-[#101010] border border-[#262626] text-[#F2EFE9] font-mono text-xs uppercase tracking-widest hover:border-[var(--color-plan)] hover:text-[var(--color-plan)] transition-all flex items-center gap-2"
        >
          <Plus size={14} /> Vincular Arquivos
        </button>
        <button
          onClick={onRefresh}
          className="p-3 bg-[#101010] border border-[#262626] text-[#737373] hover:text-[#710CCD] transition-all"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
}
