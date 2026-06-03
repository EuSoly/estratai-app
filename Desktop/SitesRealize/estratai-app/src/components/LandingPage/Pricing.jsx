import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { fadeUp } from '../../utils/animations';
import { getPlanColor } from '../../constants/plans';
import { useTheme } from '../../contexts/ThemeContext';

export default function Pricing() {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const { isDark } = useTheme();

  const plans = [
    {
      name: "Starter",
      price: "0",
      featured: false,
      features: ["1 projeto de teste", "Tempo de resposta de até 7 dias", "Exportação em PDF", "Suporte via E-mail", "Compartilhamento de seus projetos"],
    },
    {
      name: "Business",
      price: "0",
      featured: false,
      features: ["Maior limite de Projetos", "Modelos de análise customizados", "Mais integrações", "Dashboard de Projetos", "Atendimento prioritário"],
    },
    {
      name: "Enterprise",
      price: "Custom",
      featured: false,
      features: ["Múltiplas Unidades de Negócio", "Insights personalizados", "SLA de 99.9%", "Consultoria Trimestral", "Privacidade e Segurança"],
    },
  ];

  return (
    <section id="precos" className="py-24 px-6 border-b border-[#262626] bg-[#101010]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-6xl font-black uppercase text-[#F2EFE9]">Investimento.</h2>
          <p className="text-[#737373] font-nunito text-xs uppercase tracking-[0.3em] mt-4">Consultoria sem taxas ocultas</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => {
            const c = getPlanColor(plan.name);
            const isHovered = hoveredIdx === idx;

            const cardStyle = plan.featured
              ? { borderColor: c.hex, backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF', boxShadow: isDark ? 'none' : `0 0 0 2px ${c.hex}` }
              : { borderColor: isHovered ? c.border : '#D8D5CF' };

            const defaultTextColor = isDark ? '#F2EFE9' : '#1a1a1a';
            const defaultBorderColor = isDark ? '#262626' : '#D8D5CF';

            const btnStyle = plan.featured
              ? {
                  backgroundColor: isHovered ? (isDark ? '#F2EFE9' : '#1a1a1a') : c.hex,
                  color: isHovered ? (isDark ? '#0A0A0A' : '#F2EFE9') : '#0A0A0A',
                }
              : {
                  borderColor: isHovered ? c.hex : defaultBorderColor,
                  color: isHovered ? c.hex : defaultTextColor,
                };

            return (
              <div
                key={idx}
                className="p-10 border flex flex-col transition-colors duration-200"
                style={cardStyle}
              >
                <span
                  className="font-nunito text-[14px] uppercase mb-2"
                  style={{ color: c.hex }}
                >
                  {plan.name}
                </span>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-[#F2EFE9] font-nunito text-sm">R$</span>
                  <span className="text-[#F2EFE9] font-serif text-6xl font-black">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-[#525252] font-nunito text-xs">/mês</span>}
                </div>
                <ul className="space-y-4 mb-12 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-[#A3A3A3] text-xs font-nunito uppercase">
                      <Check size={14} style={{ color: c.hex }} /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="w-full py-4 font-nunito text-xs uppercase font-bold tracking-widest transition-all duration-200 border"
                  style={btnStyle}
                >
                  Selecionar Plano
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
