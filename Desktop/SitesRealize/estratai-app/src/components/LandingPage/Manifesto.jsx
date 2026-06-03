import React from 'react';
import { motion } from 'framer-motion';
import { Target, Layers, Activity } from 'lucide-react';
import { fadeUp, staggerContainer } from '../../utils/animations';

export default function Manifesto() {
  return (
    <section className="py-24 md:py-40 px-6 bg-[#101010] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="mb-20 max-w-4xl">
          <h2 className="font-serif text-4xl md:text-6xl font-black leading-tight uppercase text-[#F2EFE9]">
            Não é falta de visão.<br/>
            é lacuna de <span className="text-[#842CD5]">alinhamento.</span>
          </h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div variants={fadeUp} className="border border-[#262626] bg-[#0A0A0A] p-10 hover:border-[#842CD5] transition-colors duration-500">
            <Target className="w-8 h-8 text-[#525252] mb-8" />
            <h3 className="font-sans text-xl font-bold mb-4 text-[#F2EFE9]">Silos Operacionais</h3>
            <p className="text-[#A3A3A3] leading-relaxed">As unidades de negócios operam de forma isolada. O que à prioridade para a equipe técnica raramente reflete a urgência do conselho e da diretoria.</p>
          </motion.div>

          <motion.div variants={fadeUp} className="border border-[#262626] bg-[#0A0A0A] p-10 hover:border-[#842CD5] transition-colors duration-500">
            <Layers className="w-8 h-8 text-[#525252] mb-8" />
            <h3 className="font-sans text-xl font-bold mb-4 text-[#F2EFE9]">Sobrecarga Invisível</h3>
            <p className="text-[#A3A3A3] leading-relaxed">Gestores afogados em métricas de vaidade, enquanto o verdadeiro gargalo que drena a margem de lucro permanece oculto nas operções diárias.</p>
          </motion.div>

          <motion.div variants={fadeUp} className="border border-[#262626] bg-[#0A0A0A] p-10 hover:border-[#842CD5] transition-colors duration-500">
            <Activity className="w-8 h-8 text-[#525252] mb-8" />
            <h3 className="font-sans text-xl font-bold mb-4 text-[#525252]">O Custo da Inércia</h3>
            <p className="text-[#A3A3A3] leading-relaxed">Cada semana que a sua equipe passa desenvolvendo a funcionalidade errada ou gerenciando o projeto incorreto, a sua empresa perde competitividade de forma irreversvel.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}