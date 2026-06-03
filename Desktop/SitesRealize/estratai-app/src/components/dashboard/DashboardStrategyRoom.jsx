import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  ArrowLeft, Download, Sparkles, Save, Edit3, 
  CheckCircle2, AlertTriangle, FileText, RefreshCw, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardStrategyRoom({ project, onBack }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeAIPanel, setActiveAIPanel] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Estado inicial seguro
  const [report, setReport] = useState({
    executiveSummary: "Aguardando processamento...",
    risks: [],
    actionPlan: ""
  });

  useEffect(() => {
    if (project) fetchProjectReport();
  }, [project]);

  const fetchProjectReport = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('report_data, status')
        .eq('id', project.id)
        .single();

      if (error) {
        console.warn("Aviso EstratAI: Erro ao buscar no Supabase. Carregando dados de simulação...", error.message);
        loadMockData();
        return;
      }

      if (data && data.report_data && Object.keys(data.report_data).length > 0) {
        setReport(data.report_data);
      } else {
        loadMockData();
      }
    } catch (err) {
      console.error("Erro fatal no motor de inteligência:", err);
      loadMockData();
    }
  };

  const loadMockData = () => {
    setReport({
      executiveSummary: "A análise preliminar indica um desalinhamento de 42% na alocação de recursos seniores nas sprints atuais. A prioridade de entrega não reflete a meta de faturamento Q3.",
      risks: [
        "Falta de documentação técnica no módulo de pagamentos.",
        "Sobrecarga de 120% na equipe de QA."
      ],
      actionPlan: "1. Realocar 2 Devs Seniores para o Core Engine.\n2. Pausar feature de 'Gamificação' até estabilização do checkout.\n3. Contratar auditoria de segurança externa."
    });
  };

  const saveReport = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({ report_data: report, status: 'Alinhado' })
      .eq('id', project.id);
    
    setTimeout(() => setIsSaving(false), 800);
    if (!error) setIsEditing(false);
  };

  const handleReanalyze = () => {
    if (!aiPrompt) return;
    setIsProcessingAI(true);
    
    setTimeout(() => {
      if (activeAIPanel === 'executiveSummary') {
        setReport(prev => ({...prev, executiveSummary: `[REESCRITO PELA IA: ${aiPrompt}] ` + (prev.executiveSummary || '')}));
      } else if (activeAIPanel === 'actionPlan') {
        setReport(prev => ({...prev, actionPlan: `[NOVA ROTA CALCULADA: ${aiPrompt}]\n` + (prev.actionPlan || '')}));
      }
      setIsProcessingAI(false);
      setActiveAIPanel(null);
      setAiPrompt("");
    }, 2500);
  };

  if (!project) return null;

  return (
    <div className="space-y-6 relative min-h-screen flex flex-col pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#262626] pb-6 gap-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-3 border border-[#262626] bg-[#101010] text-[#525252] hover:text-[#710CCD] hover:border-[#710CCD] transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-serif text-3xl font-black uppercase text-[#F2EFE9] mb-1">
              {project?.name || "Projeto Desconhecido"}
            </h1>
            <div className="flex gap-4 font-mono text-[10px] uppercase tracking-widest text-[#737373]">
              <span>ID: {project?.id?.split('-')[0] || "000"}</span>
              <span>•</span>
              <span className="text-[var(--color-plan)]">Plano de Correção Ativo</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold transition-colors border ${isEditing ? 'border-[var(--color-plan)] text-[var(--color-plan)] bg-[var(--color-plan-10)]' : 'border-[#262626] text-[#A3A3A3] hover:text-[#710CCD] hover:bg-[#101010]'}`}
          >
            <Edit3 size={14} /> {isEditing ? 'Modo Leitura' : 'Modo Edição'}
          </button>

          <button 
            onClick={saveReport}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#262626] text-[#F2EFE9] px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-[#525252] transition-colors disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} 
            Salvar
          </button>

          <button className="flex items-center gap-2 bg-[#F2EFE9] text-[#0A0A0A] px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-[var(--color-plan)] hover:text-[#710CCD] transition-colors">
            <Download size={14} /> Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
        
        {/* CORREÇÃO DO TAILWIND AQUI: Sintaxe explícita */}
        <div className={`${activeAIPanel ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-8 transition-all duration-300 ease-in-out`}>
          
          <div className="group border border-[#262626] bg-[#101010] p-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[#737373] flex items-center gap-2">
                <FileText size={14} className="text-[var(--color-plan)]" /> 01. Diagnóstico Executivo
              </h3>
              {!isEditing && (
                <button 
                  onClick={() => setActiveAIPanel('executiveSummary')}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-2 font-mono text-[10px] uppercase text-[var(--color-plan)] hover:text-[#710CCD] transition-all bg-[var(--color-plan-10)] px-3 py-1 border border-[var(--color-plan-30)]"
                >
                  <Sparkles size={12} /> Re-analisar com IA
                </button>
              )}
            </div>
            
            {isEditing ? (
              <textarea 
                value={report?.executiveSummary || ''}
                onChange={(e) => setReport({...report, executiveSummary: e.target.value})}
                className="w-full bg-transparent text-[#F2EFE9] font-serif text-lg leading-relaxed outline-none border-b border-[#262626] focus:border-[var(--color-plan)] transition-colors resize-none min-h-[120px]"
              />
            ) : (
              <p className="text-[#F2EFE9] font-serif text-xl leading-relaxed">
                {report?.executiveSummary || 'Sem dados.'}
              </p>
            )}
          </div>

          <div className="border border-[#262626] bg-[#101010] p-8">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#737373] flex items-center gap-2 mb-6">
              <AlertTriangle size={14} className="text-[var(--color-plan)]" /> 02. Vetores de Risco Ativos
            </h3>
            <ul className="space-y-4">
              {/* CORREÇÃO DO REACT: Optional chaining e fallback caso risks não exista */}
              {(report?.risks || []).length > 0 ? (
                report.risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-3 text-[#A3A3A3] font-sans text-sm">
                    <span className="text-[var(--color-plan)] font-mono mt-0.5">[{index + 1}]</span>
                    {risk}
                  </li>
                ))
              ) : (
                <li className="text-[#737373] font-mono text-sm">Nenhum risco processado ainda.</li>
              )}
            </ul>
          </div>

          <div className="group border border-[#262626] bg-[#101010] p-8 relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[#737373] flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[var(--color-plan)]" /> 03. Plano de Ação Tático
              </h3>
              {!isEditing && (
                <button 
                  onClick={() => setActiveAIPanel('actionPlan')}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-2 font-mono text-[10px] uppercase text-[var(--color-plan)] hover:text-[#710CCD] transition-all bg-[var(--color-plan-10)] px-3 py-1 border border-[var(--color-plan-30)]"
                >
                  <Sparkles size={12} /> Expandir Rota com IA
                </button>
              )}
            </div>
            
            {isEditing ? (
              <textarea 
                value={report?.actionPlan || ''}
                onChange={(e) => setReport({...report, actionPlan: e.target.value})}
                className="w-full bg-transparent text-[#F2EFE9] font-mono text-sm leading-loose outline-none border-b border-[#262626] focus:border-[var(--color-plan)] transition-colors resize-none min-h-[200px]"
              />
            ) : (
              <pre className="text-[#A3A3A3] font-mono text-sm leading-loose whitespace-pre-wrap font-sans">
                {report?.actionPlan || 'Aguardando processamento...'}
              </pre>
            )}
          </div>
        </div>

        <AnimatePresence>
          {activeAIPanel && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
              className="lg:col-span-4 sticky top-6 border border-[var(--color-plan-30)] bg-[#101010] flex flex-col shadow-2xl shadow-[var(--color-plan-05)]"
            >
              <div className="border-b border-[#262626] p-4 flex items-center justify-between bg-[#0A0A0A]">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[var(--color-plan)]" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#F2EFE9]">Auditor Neural Activo</span>
                </div>
                <button onClick={() => setActiveAIPanel(null)} className="text-[#737373] hover:text-[var(--color-plan)]">
                  <X size={14} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <p className="font-mono text-[10px] uppercase text-[#737373] mb-2">Contexto Selecionado:</p>
                  <div className="border-l-2 border-[#262626] pl-3 text-sm text-[#A3A3A3] italic line-clamp-3">
                    {activeAIPanel === 'executiveSummary' ? report?.executiveSummary : report?.actionPlan}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase text-[#F2EFE9] block mb-3">Parâmetro de Refinamento:</label>
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ex: Reescreva com um tom mais agressivo..."
                    className="w-full bg-[#0A0A0A] border border-[#262626] text-[#F2EFE9] p-4 font-sans text-sm focus:border-[var(--color-plan)] outline-none resize-none min-h-[120px]"
                  />
                </div>

                <button 
                  onClick={handleReanalyze}
                  disabled={isProcessingAI || !aiPrompt}
                  className="w-full bg-[var(--color-plan)] text-[#0A0A0A] px-6 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-[#710CCD] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessingAI ? (
                    <><RefreshCw size={14} className="animate-spin" /> Recalculando Rotas...</>
                  ) : (
                    <><Sparkles size={14} /> Executar Refinamento</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}