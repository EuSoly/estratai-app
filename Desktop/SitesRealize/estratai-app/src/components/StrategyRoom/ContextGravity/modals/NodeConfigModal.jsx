import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Type, Palette, Layout, BrainCircuit, FileText, Target, Eye } from 'lucide-react';

const ICON_LIBRARY = { file: FileText, brain: BrainCircuit, target: Target, eye: Eye };
const COLORS = [
  { label: 'Laranja',  hex: '#842CD5' },
  { label: 'Verde',    hex: '#10B981' },
  { label: 'Vermelho', hex: '#EF4444' },
  { label: 'Azul',     hex: '#3B82F6' },
  { label: 'Branco',   hex: '#F2EFE9' },
  { label: 'Cinza',    hex: '#737373' },
];
const INTENTS = [
  { id: 'neutral', label: 'Arquivo Base',       color: 'text-[#737373]' },
  { id: 'good',    label: 'Exemplo de Sucesso', color: 'text-emerald-400' },
  { id: 'bad',     label: 'Anti-Padrão',        color: 'text-red-400' },
];

// Estado local — não depende de onChange externo para funcionar
export default function NodeConfigModal({ file: initialFile, onSave, onClose }) {
  const [file, setFile] = useState(initialFile);

  const update = (patch) => setFile(prev => ({ ...prev, ...patch }));

  return (
    <div className="fixed inset-0 bg-[#0A0A0A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.form
        onSubmit={e => { e.preventDefault(); onSave(file); }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="w-full max-w-md bg-[#0A0A0A] border border-[#262626] p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#262626] pb-4">
          <span className="font-mono text-xs text-[#F2EFE9] uppercase tracking-widest font-bold flex items-center gap-2">
            <Layout size={14} className="text-[var(--color-plan)]" /> Parametrização do Satélite
          </span>
          <button type="button" onClick={onClose} className="text-[#737373] hover:text-[#710CCD]">
            <X size={16} />
          </button>
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <label className="font-mono text-[10px] text-[#525252] uppercase tracking-wider flex items-center gap-1.5">
            <Type size={11} /> Nome Corporativo
          </label>
          <input
            type="text"
            required
            value={file.name}
            onChange={e => update({ name: e.target.value })}
            className="w-full bg-[#101010] border border-[#262626] text-[#F2EFE9] font-mono text-xs p-2.5 outline-none focus:border-[var(--color-plan)] transition-colors"
          />
        </div>

        {/* Ícone */}
        <div className="space-y-2">
          <label className="font-mono text-[10px] text-[#525252] uppercase tracking-wider flex items-center gap-1.5">
            <Layout size={11} /> Vetor Visual (Ícone)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(ICON_LIBRARY).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => update({ customIcon: key })}
                className={`p-3 border transition-all flex justify-center ${
                  file.customIcon === key
                    ? 'border-[var(--color-plan)] bg-[var(--color-plan-10)] text-[var(--color-plan)]'
                    : 'border-[#262626] text-[#737373] hover:border-[#525252] hover:text-[#710CCD]'
                }`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Cor */}
        <div className="space-y-2">
          <label className="font-mono text-[10px] text-[#525252] uppercase tracking-wider flex items-center gap-1.5">
            <Palette size={11} /> Vetor Térmico (Cor)
          </label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(({ hex, label }) => (
              <button
                key={hex}
                type="button"
                title={label}
                onClick={() => update({ customColor: file.customColor === hex ? null : hex })}
                className="w-7 h-7 relative flex items-center justify-center border-2 transition-all"
                style={{
                  backgroundColor: hex,
                  borderColor: file.customColor === hex ? '#F2EFE9' : 'transparent',
                }}
              >
                {file.customColor === hex && (
                  <div className="w-2 h-2 bg-[#0A0A0A] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Classificação / Intent */}
        <div className="space-y-2">
          <label className="font-mono text-[10px] text-[#525252] uppercase tracking-wider flex items-center gap-1.5">
            <BrainCircuit size={11} /> Classificação Contextual (IA)
          </label>
          <div className="flex flex-col gap-2">
            {INTENTS.map(opt => (
              <label
                key={opt.id}
                className={`p-3 border flex items-center gap-3 cursor-pointer transition-all ${
                  file.intent === opt.id ? 'border-[var(--color-plan)] bg-[var(--color-plan-05)]' : 'border-[#262626] hover:border-[#525252]'
                }`}
              >
                <input
                  type="radio"
                  name="intent"
                  checked={file.intent === opt.id}
                  onChange={() => update({ intent: opt.id })}
                  className="accent-[var(--color-plan)]"
                />
                <span className={`font-mono text-xs ${opt.color}`}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2 border-t border-[#262626] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#262626] font-mono text-[10px] uppercase text-[#737373] hover:text-[#710CCD] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--color-plan)] text-[#0A0A0A] font-mono text-[10px] font-bold uppercase hover:bg-[#710CCD] transition-colors"
          >
            Salvar Parâmetros
          </button>
        </div>
      </motion.form>
    </div>
  );
}
