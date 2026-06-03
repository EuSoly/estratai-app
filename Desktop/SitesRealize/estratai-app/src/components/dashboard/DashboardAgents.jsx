import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { PLAN_LEVELS, getPlanColor } from '../../constants/plans';

function PlanBadge({ plan, muted = false }) {
  const c = getPlanColor(plan);
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 font-bold"
      style={muted
        ? { color: '#525252', border: '1px solid #262626' }
        : { color: c.hex, backgroundColor: c.bg, border: `1px solid ${c.border}` }
      }
    >
      {plan}
    </span>
  );
}

export default function DashboardAgents({ userPlan = 'Starter' }) {
  const [agentes, setAgentes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setAgentes(data);
      } catch (error) {
        console.error("Erro ao buscar matriz de agentes:", error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgents();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-[#A3A3A3] font-mono text-sm uppercase tracking-widest animate-pulse">
          Inicializando matriz neural...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      
      {/* --- HEADER --- */}
      <div>
        <h1 className="font-serif text-4xl font-black uppercase text-[#F2EFE9] mb-2">Matriz de Agentes.</h1>
        <p className="text-[#A3A3A3] font-mono text-sm uppercase tracking-widest">Catálogo de inteligência algorítmica especializada.</p>
      </div>

      {/* --- GRID DE AGENTES --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agentes.map((agente) => {
          // Resolve o ícone dinamicamente baseado no banco (Fallback para 'Cpu' se der erro)
          const Icon = LucideIcons[agente.icon_name] || LucideIcons.Cpu;
          
          // Lógica de bloqueio baseada na hierarquia dos planos
          const userLevel = PLAN_LEVELS[userPlan] || 1;
          const agentLevel = PLAN_LEVELS[agente.plan_required] || 1;
          const isLocked = userLevel < agentLevel;

          return (
            <div 
              key={agente.id} 
              className={`relative flex flex-col border p-8 transition-all duration-500 min-h-[360px]
                ${isLocked 
                  ? 'border-[#262626] bg-[#0A0A0A] opacity-60 grayscale-[0.5]' 
                  : 'border-[#262626] bg-[#101010] hover:border-[var(--color-plan-50)] hover:bg-[var(--color-plan-05)]'}`}
            >
              
              {/* TOPO DO CARD: ÍCONE E PLANO */}
              <div className="flex justify-between items-start mb-6 z-10 relative">
                <div className={`p-3 border border-[#B279E7] ${!isLocked && 'text-[#B279E7] border-[#B279E7]/20 bg-[#B279E7]/10'}`}>
                  <Icon className={`w-6 h-6 ${isLocked ? 'text-[#B279E7]' : 'text-[#B279E7]'}`} />
                </div>
                <PlanBadge plan={agente.plan_required} muted={isLocked} />
              </div>

              {/* CONTEÚDO */}
              <div className="z-10 relative flex-1 flex flex-col">
                <h3 className="font-serif text-2xl font-bold uppercase text-[#B279E7] mb-4">{agente.name}</h3>
                <p className="text-[#A3A3A3] text-sm font-sans leading-relaxed mb-8 flex-1">{agente.description}</p>

                {/* BOTÕES DE AÇÃO / UPSELL */}
                {isLocked ? (
                  <button className="w-full border border-[#262626] py-4 font-mono text-xs uppercase tracking-widest text-[#737373] hover:border-[var(--color-plan)] hover:text-[var(--color-plan)] transition-colors flex items-center justify-center gap-2 group bg-[#101010]">
                    <Lock className="w-4 h-4 group-hover:animate-pulse text-[var(--color-plan)]" />
                    Solicitar Upgrade
                  </button>
                ) : (
                  <button className="w-full border border-[var(--color-plan)] text-[var(--color-plan)] py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-[var(--color-plan)] hover:text-[#0A0A0A] transition-colors flex items-center justify-center gap-2">
                    Agente Habilitado <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* OVERLAY DE BLOQUEIO INVISÍVEL (UX) */}
              {isLocked && (
                 <div className="absolute inset-0 z-20 cursor-not-allowed" title={`Este agente requer o plano ${agente.plan_required}`} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* --- BANNER DE UPSELL GERAL BRUTALISTA --- */}
      <div className="border border-[var(--color-plan-30)] bg-[var(--color-plan-05)] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
           <h4 className="font-serif text-xl font-bold text-[#F2EFE9] uppercase mb-2">Precisa de poder de fogo total?</h4>
           <p className="text-[#A3A3A3] font-mono text-xs tracking-widest uppercase">Desbloqueie agentes treinados especificamente com a documentação e os segredos da sua empresa.</p>
        </div>
        <button className="whitespace-nowrap bg-[#F2EFE9] text-[#0A0A0A] px-8 py-4 font-mono text-xs font-black uppercase tracking-widest hover:bg-[var(--color-plan)] transition-colors">
          Falar com Comercial
        </button>
      </div>

    </div>
  );
}