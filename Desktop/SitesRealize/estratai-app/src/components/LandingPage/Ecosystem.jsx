import React from 'react';
import { motion } from 'framer-motion';
import { Database, FileText, Presentation, Table, FileDigit } from 'lucide-react';

const ECOSYSTEM_TOOLS = [
  { name: 'Word',       icon: FileText },
  { name: 'PowerPoint', icon: Presentation },
  { name: 'Excel',      icon: Table },
  { name: 'PDF',        icon: FileDigit },
];

// 4 cópias: a animação percorre -50% (2 cópias) e reseta �
// o início e o fim mostram conteúdo idêntico, então o loop é imperceptível
const loopedTools = [...ECOSYSTEM_TOOLS, ...ECOSYSTEM_TOOLS, ...ECOSYSTEM_TOOLS, ...ECOSYSTEM_TOOLS];

export default function Ecosystem() {
  return (
    <section className="border-b border-[#262626] bg-[#0A0A0A] overflow-hidden py-5 relative">
      <div
        className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-6 md:gap-12"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        }}
      >
        {/* Título fixo à esquerda */}
        <div className="flex items-center gap-3 shrink-0 z-10 bg-[#0A0A0A] pr-4">
          <div className="relative flex items-center justify-center w-6 h-6">
            <motion.div
              className="absolute inset-0 border border-[#842CD5] rounded-sm"
              animate={{ rotate: 180, scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            <Database className="w-3 h-3 text-[#842CD5]" />
          </div>
          <span className="font-nunito text-xs uppercase tracking-widest text-[#F2EFE9] font-bold">
            Ecossistemas <span className="text-[#737373]">Mapeáveis:</span>
          </span>
        </div>

        {/* Carrossel infinito */}
        <div className="flex-1 overflow-hidden relative flex items-center">
          <motion.div
            className="flex gap-12 w-max"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          >
            {loopedTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <div key={index} className="flex items-center gap-3 group cursor-default">
                  <Icon className="w-4 h-4 text-[#525252] group-hover:text-[#842CD5] transition-colors duration-300" />
                  <span className="font-nunito text-sm uppercase tracking-wider text-[#525252] group-hover:text-[#710CCD] transition-colors duration-300 whitespace-nowrap">
                    {tool.name}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
