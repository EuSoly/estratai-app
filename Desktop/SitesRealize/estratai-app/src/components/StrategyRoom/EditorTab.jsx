import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Download, Sparkles, Save, Edit3, RefreshCw, X,
  TrendingUp, TrendingDown, Zap, ShieldAlert,
  AlertTriangle, AlertCircle, Info, CheckCircle2,
  ChevronRight, ChevronUp, ChevronDown, User, Clock, BarChart2,
  Plus, FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Normaliza insight para formato objeto (compatibilidade com string[] legado)
function toInsightObj(insight) {
  if (typeof insight === 'string') return { text: insight, detail: '', sources: [] };
  return { text: '', detail: '', sources: [], ...insight };
}

// ─── Mock — espelha exatamente o JSON que o n8n deve salvar em report_data ───
const MOCK_REPORT = {
  generatedAt: '2026-06-01T14:30:00Z',
  agentName: 'Auditor Estratégico v2',
  score: 72,
  contextFiles: [
    'relatorio-financeiro-q1.pdf',
    'pesquisa-mercado-latam.xlsx',
    'nps-pesquisa-clientes.pdf',
    'roadmap-produto-2026.pdf',
  ],
  executiveSummary:
    'A empresa apresenta uma base operacional sólida, com processos documentados e equipe alinhada aos objetivos táticos de curto prazo. A ausência de visão estratégica de médio prazo e a dependência excessiva de um único canal de aquisição representam os vetores de risco mais críticos identificados. A janela de oportunidade no segmento B2B enterprise está se fechando nos próximos 6 meses, exigindo decisão imediata sobre posicionamento e priorização de recursos.',
  swot: {
    strengths: [
      'Produto com NPS acima da média do mercado (72)',
      'Time técnico sênior com baixo turnover histórico',
      'Margem bruta saudável de 68% — referência no setor',
    ],
    weaknesses: [
      'Dependência de 80% da receita em apenas 3 clientes',
      'Ausência de processo de vendas estruturado e documentado',
      'Stack legada no módulo financeiro aumenta custo de manutenção',
    ],
    opportunities: [
      'Expansão LATAM com baixa concorrência nos próximos 6 meses',
      'Regulamentação favorável cria barreira de entrada significativa',
      'Parceria estratégica com distribuidor regional em negociação',
    ],
    threats: [
      'Entrante bem capitalizado anunciado para entrada em Q3',
      'Pressão de pricing de concorrente asiático no tier mid-market',
      'Instabilidade cambial impacta contratos denominados em USD',
    ],
  },
  risks: [
    {
      id: 1, severity: 'critical',
      title: 'Concentração de Receita',
      description: 'Top 3 clientes representam 80% do ARR. Perda de qualquer um impacta o runway em até 8 meses.',
    },
    {
      id: 2, severity: 'high',
      title: 'Ausência de Pipeline Estruturado',
      description: 'Sem funil de vendas previsível, a empresa não consegue projetar crescimento com confiança.',
    },
    {
      id: 3, severity: 'medium',
      title: 'Dívida Técnica no Módulo Financeiro',
      description: 'Stack legada aumenta custo de manutenção em 40% e bloqueia integrações estratégicas.',
    },
    {
      id: 4, severity: 'low',
      title: 'Exposição Cambial sem Hedge',
      description: 'Contratos em USD sem proteção expõem a margem a variações acima de 10%.',
    },
  ],
  actionPlan: [
    { priority: 1, action: 'Diversificar base de clientes — meta: concentração < 50% em 12 meses', deadline: '12 meses', owner: 'CEO + Vendas' },
    { priority: 2, action: 'Implementar CRM e playbook de vendas documentado', deadline: '60 dias', owner: 'Head de Vendas' },
    { priority: 3, action: 'Iniciar due diligence da parceria com distribuidor LATAM', deadline: '30 dias', owner: 'CEO' },
    { priority: 4, action: 'Migração do módulo financeiro — roadmap e orçamento aprovados', deadline: '90 dias', owner: 'CTO' },
  ],
  insights: [
    {
      text: 'PMF validado — problema é go-to-market',
      detail: 'O produto tem retenção acima de 85% e NPS 72. O gargalo está em aquisição e ativação, não em produto. Investir em desenvolvimento de produto agora seria desperdício de capital.',
      sources: ['nps-pesquisa-clientes.pdf'],
    },
    {
      text: 'Crescimento bloqueado por vendas, não produto',
      detail: 'A análise do pipeline mostra que 72% das oportunidades se perdem na fase de qualificação por falta de processo estruturado. Um CRM com playbook reduziria essa perda em 40–60%.',
      sources: ['relatorio-financeiro-q1.pdf'],
    },
    {
      text: 'Janela LATAM: 6 meses de vantagem',
      detail: 'O principal concorrente ainda não tem presença local na América Latina. A regulamentação favorável cria uma janela de 6 meses para ganhar market share com custo de aquisição 3x menor.',
      sources: ['pesquisa-mercado-latam.xlsx'],
    },
    {
      text: 'Fundraise acelerado com pipeline estruturado',
      detail: 'Investidores requerem previsibilidade de receita. Com pipeline estruturado e MRR crescendo de forma consistente, o valuation sobe e o fundraise fica viável em Q3.',
      sources: ['relatorio-financeiro-q1.pdf', 'roadmap-produto-2026.pdf'],
    },
  ],
};

// ─── Configs ─────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: { label: 'CRÍTICO', color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   Icon: AlertCircle },
  high:     { label: 'ALTO',    color: '#f97316', bg: 'rgba(249,115,22,0.08)',  Icon: AlertTriangle },
  medium:   { label: 'MÉDIO',   color: '#eab308', bg: 'rgba(234,179,8,0.08)',   Icon: Info },
  low:      { label: 'BAIXO',   color: '#737373', bg: 'rgba(115,115,115,0.08)', Icon: CheckCircle2 },
};

const SWOT_CONFIG = [
  { key: 'strengths',     label: 'Forças',        Icon: TrendingUp,   accent: '#10b981' },
  { key: 'weaknesses',    label: 'Fraquezas',     Icon: TrendingDown, accent: '#ef4444' },
  { key: 'opportunities', label: 'Oportunidades', Icon: Zap,          accent: '#3b82f6' },
  { key: 'threats',       label: 'Ameaças',       Icon: ShieldAlert,  accent: '#f97316' },
];

const SECTION_NAMES = {
  executiveSummary: 'Diagnóstico Executivo',
  swot:             'Análise SWOT',
  risks:            'Vetores de Risco',
  actionPlan:       'Plano de Ação',
  insights:         'Insights Estratégicos',
};

const COPILOT_ACTIONS = {
  executiveSummary: ['Re-gerar diagnóstico', 'Aprofundar contexto', 'Simplificar linguagem'],
  swot:             ['Aprofundar forças', 'Ameaças ocultas', 'Cruzar fraquezas × riscos', 'Re-gerar quadrante'],
  risks:            ['Riscos ocultos', 'Re-avaliar severidades', 'Plano de mitigação'],
  actionPlan:       ['Priorizar ações', 'Adicionar milestones', 'Simplificar plano'],
  insights:         ['Insights adicionais', 'Insights de crescimento', 'Alerta estratégico'],
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ScoreBar({ score }) {
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#eab308' : '#ef4444';
  const label = score >= 70 ? 'Saudável' : score >= 50 ? 'Atenção' : 'Crítico';
  return (
    <div className="flex items-end gap-8">
      <div>
        <span className="font-serif text-8xl font-black leading-none" style={{ color }}>{score}</span>
        <span className="font-mono text-lg text-[#525252] ml-1">/100</span>
      </div>
      <div className="flex-1 pb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">Saúde Estratégica</span>
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color }}>{label}</span>
        </div>
        <div className="h-1.5 bg-[#1a1a1a] w-full">
          <motion.div
            className="h-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-4 bg-[var(--color-plan)]" />
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#737373]">{children}</span>
    </div>
  );
}

function SectionCard({ label, subtitle, isEditing, onCopilot, children }) {
  return (
    <div className="border border-[#262626] bg-[#101010] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1a1a1a] bg-[#0d0d0d]">
        <div className="flex items-center gap-3">
          <div className="w-[3px] h-[14px] bg-[var(--color-plan)] shrink-0" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F2EFE9] font-bold">{label}</span>
          {subtitle && (
            <span className="font-mono text-[9px] text-[#525252] tracking-widest">{subtitle}</span>
          )}
        </div>
        {!isEditing && onCopilot && (
          <button
            type="button"
            onClick={onCopilot}
            className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[var(--color-plan)] hover:bg-[var(--color-plan-10)] border border-transparent hover:border-[var(--color-plan-30)] px-2.5 py-1.5 transition-all shrink-0"
          >
            <Sparkles size={11} /> copiloto
          </button>
        )}
      </div>
      <div className="p-8">
        {children}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function EditorTab({ project }) {
  const [isEditing, setIsEditing]           = useState(false);
  const [isSaving, setIsSaving]             = useState(false);
  const [aiPanel, setAiPanel]               = useState(null);
  const [aiPrompt, setAiPrompt]             = useState('');
  const [aiDraft, setAiDraft]               = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [report, setReport]                 = useState(null);
  const [expandedInsight, setExpandedInsight] = useState(null);
  const [showContextFiles, setShowContextFiles] = useState(false);

  useEffect(() => {
    if (project) fetchReport();
  }, [project]);

  const fetchReport = async () => {
    try {
      if (!project?.id) {
        setReport(MOCK_REPORT);
        return;
      }

      const { data } = await supabase
        .from('projects')
        .select('report_data')
        .eq('id', project.id)
        .single();
      setReport(data?.report_data && Object.keys(data.report_data).length > 0
        ? data.report_data
        : MOCK_REPORT);
    } catch {
      setReport(MOCK_REPORT);
    }
  };

  const saveReport = async () => {
    setIsSaving(true);
    await supabase.from('projects').update({ report_data: report }).eq('id', project.id);
    setTimeout(() => { setIsSaving(false); setIsEditing(false); }, 600);
  };

  const toggleEdit = () => {
    setIsEditing(v => !v);
    setExpandedInsight(null);
  };

  const handleAiAction = (prompt) => {
    if (!prompt || !aiPanel) return;
    setIsProcessingAI(true);
    setAiDraft('');
    setTimeout(() => {
      setAiDraft(`Sugestão do Copiloto para "${SECTION_NAMES[aiPanel.section]}":\n\n${prompt}\n\n[Conteúdo gerado. Edite conforme necessário antes de aplicar.]`);
      setIsProcessingAI(false);
    }, 2000);
  };

  const applyAiDraft = () => {
    if (!aiDraft || !aiPanel) return;
    const { section } = aiPanel;
    if (section === 'executiveSummary') {
      setReport(r => ({ ...r, executiveSummary: aiDraft }));
    } else if (section === 'insights') {
      setReport(r => ({ ...r, insights: [...(r.insights || []).map(toInsightObj), { text: aiDraft, detail: '', sources: [] }] }));
    } else if (section === 'risks') {
      const newId = Math.max(0, ...(report.risks || []).map(r => r.id)) + 1;
      setReport(r => ({ ...r, risks: [...(r.risks || []), { id: newId, severity: 'medium', title: 'Sugestão IA', description: aiDraft }] }));
    } else if (section === 'actionPlan') {
      setReport(r => ({ ...r, actionPlan: [...(r.actionPlan || []), { priority: (r.actionPlan?.length || 0) + 1, action: aiDraft, deadline: '', owner: '' }] }));
    }
    closeAiPanel();
  };

  const closeAiPanel = () => {
    setAiPanel(null);
    setAiPrompt('');
    setAiDraft('');
  };

  // ── SWOT helpers ──────────────────────────────────────────────────────────
  const addSwotItem    = (key) =>
    setReport(r => ({ ...r, swot: { ...r.swot, [key]: [...(r.swot[key] || []), ''] } }));
  const removeSwotItem = (key, i) => {
    const next = [...report.swot[key]]; next.splice(i, 1);
    setReport(r => ({ ...r, swot: { ...r.swot, [key]: next } }));
  };
  const updateSwotItem = (key, i, val) => {
    const next = [...report.swot[key]]; next[i] = val;
    setReport(r => ({ ...r, swot: { ...r.swot, [key]: next } }));
  };

  // ── Risk helpers ──────────────────────────────────────────────────────────
  const updateRisk = (id, field, val) =>
    setReport(r => ({ ...r, risks: r.risks.map(risk => risk.id === id ? { ...risk, [field]: val } : risk) }));
  const removeRisk = (id) =>
    setReport(r => ({ ...r, risks: r.risks.filter(risk => risk.id !== id) }));
  const addRisk = () => {
    const newId = Math.max(0, ...(report.risks || []).map(r => r.id)) + 1;
    setReport(r => ({
      ...r,
      risks: [...(r.risks || []), { id: newId, severity: 'medium', title: 'Novo Risco', description: '' }],
    }));
  };

  // ── Action Plan helpers ───────────────────────────────────────────────────
  const moveAction = (i, dir) => {
    const next = [...report.actionPlan];
    const target = i + dir;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target], next[i]];
    setReport(r => ({ ...r, actionPlan: next.map((item, idx) => ({ ...item, priority: idx + 1 })) }));
  };
  const updateAction = (i, field, val) => {
    const next = [...report.actionPlan]; next[i] = { ...next[i], [field]: val };
    setReport(r => ({ ...r, actionPlan: next }));
  };
  const removeAction = (i) => {
    const next = report.actionPlan.filter((_, idx) => idx !== i);
    setReport(r => ({ ...r, actionPlan: next.map((item, idx) => ({ ...item, priority: idx + 1 })) }));
  };
  const addAction = () =>
    setReport(r => ({
      ...r,
      actionPlan: [...(r.actionPlan || []), {
        priority: (r.actionPlan?.length || 0) + 1,
        action: '', deadline: '', owner: '',
      }],
    }));

  // ── Insight helpers ───────────────────────────────────────────────────────
  const insights = (report?.insights || []).map(toInsightObj);
  const updateInsight = (i, field, val) => {
    const next = insights.map((ins, idx) => idx === i ? { ...ins, [field]: val } : ins);
    setReport(r => ({ ...r, insights: next }));
  };
  const removeInsight = (i) =>
    setReport(r => ({ ...r, insights: insights.filter((_, idx) => idx !== i) }));
  const addInsight = () =>
    setReport(r => ({ ...r, insights: [...insights, { text: '', detail: '', sources: [] }] }));

  const generatedDate = report?.generatedAt
    ? new Date(report.generatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-32 border border-dashed border-[#262626] bg-[#050505]">
        <RefreshCw size={32} className="text-[#525252] mb-4 animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#525252]">Carregando relatório...</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 relative flex flex-col">

      {/* ── TOOLBAR ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#262626]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">Gerado por</span>
            <span className="font-mono text-[10px] uppercase text-[var(--color-plan)] font-bold">{report.agentName || 'Agente IA'}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#525252]">{generatedDate}</span>
            <span className="font-mono text-[10px] text-[#262626]">//</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#525252]">
              {insights.length} insights · {report.risks?.length || 0} riscos · {report.actionPlan?.length || 0} ações
            </span>
            {report.contextFiles?.length > 0 && (
              <>
                <span className="font-mono text-[10px] text-[#262626]">//</span>
                <button
                  onClick={() => setShowContextFiles(v => !v)}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--color-plan)] hover:text-[#710CCD] transition-colors"
                >
                  <FileText size={10} />
                  {report.contextFiles.length} arquivos analisados
                  {showContextFiles ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleEdit}
            className={`flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest font-bold border transition-colors ${
              isEditing
                ? 'border-[var(--color-plan)] text-[var(--color-plan)] bg-[var(--color-plan-10)]'
                : 'border-[#262626] text-[#737373] hover:text-[#710CCD]'
            }`}
          >
            <Edit3 size={13} /> {isEditing ? 'Leitura' : 'Editar'}
          </button>
          {isEditing && (
            <button
              onClick={saveReport}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-plan)] text-[#0A0A0A] font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-[#710CCD] transition-colors disabled:opacity-50"
            >
              {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              Salvar
            </button>
          )}
          <button
            onClick={() => window.open(`/relatorio/${project?.id}`, '_blank')}
            className="flex items-center gap-2 px-5 py-2.5 border border-[#262626] text-[#737373] font-mono text-[10px] uppercase tracking-widest hover:text-[#710CCD] transition-colors"
          >
            <Download size={13} /> PDF
          </button>
        </div>
      </div>

      {/* ── BANNER DE ARQUIVOS DE CONTEXTO ────────────────────────────────────── */}
      <AnimatePresence>
        {showContextFiles && (
          <motion.div
            key="ctx-files"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden mb-6"
          >
            <div className="border border-[var(--color-plan-20)] bg-[var(--color-plan-05)] p-5">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-plan)] mb-3">
                Arquivos utilizados como base de análise:
              </p>
              <div className="flex flex-wrap gap-2">
                {report.contextFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-1.5 border border-[#262626] bg-[#0A0A0A] px-3 py-1.5">
                    <FileText size={10} className="text-[#737373] shrink-0" />
                    <span className="font-mono text-[10px] text-[#A3A3A3]">{file}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`grid gap-8 ${aiPanel ? 'grid-cols-1 lg:grid-cols-[1fr_340px]' : 'grid-cols-1'} transition-all duration-300`}>
        <div className="space-y-8 min-w-0">

          {/* ── SCORE ──────────────────────────────────────────────────────────── */}
          <div className="border border-[#262626] bg-[#101010] p-8">
            <SectionLabel>Índice de Saúde Estratégica</SectionLabel>
            <ScoreBar score={report.score ?? 0} />
          </div>

          {/* ── 01 SUMÁRIO EXECUTIVO ─────────────────────────────────────────────── */}
          <SectionCard
            label="01 // Diagnóstico Executivo"
            isEditing={isEditing}
            onCopilot={() => setAiPanel({ section: 'executiveSummary' })}
          >
            {isEditing ? (
              <textarea
                value={report.executiveSummary || ''}
                onChange={e => setReport(r => ({ ...r, executiveSummary: e.target.value }))}
                className="w-full bg-transparent text-[#F2EFE9] font-serif text-xl leading-loose outline-none border border-[#262626] focus:border-[var(--color-plan)] resize-none min-h-[200px] transition-colors p-4"
              />
            ) : (
              <p className="font-serif text-xl text-[#F2EFE9] leading-loose">
                {report.executiveSummary}
              </p>
            )}
          </SectionCard>

          {/* ── 02 SWOT ──────────────────────────────────────────────────────────── */}
          <SectionCard
            label="02 // Análise SWOT"
            subtitle="4 quadrantes"
            isEditing={isEditing}
            onCopilot={() => setAiPanel({ section: 'swot' })}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SWOT_CONFIG.map(({ key, label, Icon, accent }) => (
                <div
                  key={key}
                  className="border border-[#262626] p-5"
                  style={{ borderLeftColor: accent, borderLeftWidth: '2px' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Icon size={14} style={{ color: accent }} />
                    <span className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>
                      {label}
                    </span>
                  </div>
                  <ul className="space-y-2.5">
                    {(report.swot?.[key] || []).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#A3A3A3] font-sans text-sm leading-snug">
                        <ChevronRight size={12} className="mt-0.5 shrink-0" style={{ color: accent }} />
                        {isEditing ? (
                          <div className="flex items-start gap-1.5 flex-1">
                            <input
                              value={item}
                              onChange={e => updateSwotItem(key, i, e.target.value)}
                              className="bg-transparent text-[#A3A3A3] text-sm outline-none border-b border-[#262626] focus:border-[var(--color-plan)] flex-1 transition-colors py-0.5"
                            />
                            <button
                              onClick={() => removeSwotItem(key, i)}
                              className="text-[#525252] hover:text-[#ef4444] transition-colors mt-0.5 shrink-0"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : item}
                      </li>
                    ))}
                  </ul>
                  {isEditing && (
                    <button
                      onClick={() => addSwotItem(key)}
                      className="mt-3 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest hover:opacity-80 transition-opacity"
                      style={{ color: accent }}
                    >
                      <Plus size={11} /> Adicionar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ── 03 RISCOS ────────────────────────────────────────────────────────── */}
          <SectionCard
            label="03 // Vetores de Risco"
            subtitle={`${(report.risks || []).length} vetores`}
            isEditing={isEditing}
            onCopilot={() => setAiPanel({ section: 'risks' })}
          >
            <div className="space-y-3">
              {(report.risks || []).map(risk => {
                const cfg = SEVERITY_CONFIG[risk.severity] || SEVERITY_CONFIG.low;
                const { Icon } = cfg;
                return (
                  <div
                    key={risk.id}
                    className="p-4 border border-[#262626]"
                    style={{ backgroundColor: cfg.bg, borderLeftColor: cfg.color, borderLeftWidth: '2px' }}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 justify-between">
                          <div className="flex gap-1 flex-wrap">
                            {Object.entries(SEVERITY_CONFIG).map(([sev, s]) => (
                              <button
                                key={sev}
                                onClick={() => updateRisk(risk.id, 'severity', sev)}
                                className="font-mono text-[9px] uppercase px-2 py-1 border transition-all"
                                style={risk.severity === sev
                                  ? { color: s.color, borderColor: s.color, background: s.bg }
                                  : { color: '#525252', borderColor: '#262626' }
                                }
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => removeRisk(risk.id)}
                            className="text-[#525252] hover:text-[#ef4444] transition-colors shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <input
                          value={risk.title}
                          onChange={e => updateRisk(risk.id, 'title', e.target.value)}
                          placeholder="Título do risco"
                          className="w-full bg-transparent font-mono text-xs font-bold text-[#F2EFE9] uppercase outline-none border-b border-[#262626] focus:border-[var(--color-plan)] transition-colors pb-1"
                        />
                        <textarea
                          value={risk.description}
                          onChange={e => updateRisk(risk.id, 'description', e.target.value)}
                          placeholder="Descrição do risco..."
                          className="w-full bg-transparent font-sans text-sm text-[#737373] outline-none border border-[#262626] focus:border-[var(--color-plan)] transition-colors p-2 resize-none min-h-[60px]"
                        />
                      </div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <Icon size={16} className="mt-0.5 shrink-0" style={{ color: cfg.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span
                              className="font-mono text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5"
                              style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.color}40` }}
                            >
                              {cfg.label}
                            </span>
                            <span className="font-mono text-xs font-bold text-[#F2EFE9] uppercase tracking-wide">
                              {risk.title}
                            </span>
                          </div>
                          <p className="font-sans text-sm text-[#737373] leading-snug">{risk.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {isEditing && (
              <button
                onClick={addRisk}
                className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#737373] hover:text-[var(--color-plan)] border border-dashed border-[#262626] hover:border-[var(--color-plan)]/40 px-4 py-3 w-full justify-center transition-colors"
              >
                <Plus size={13} /> Adicionar Risco
              </button>
            )}
          </SectionCard>

          {/* ── 04 PLANO DE AÇÃO ─────────────────────────────────────────────────── */}
          <SectionCard
            label="04 // Plano de Ação"
            subtitle={`${(report.actionPlan || []).length} ações`}
            isEditing={isEditing}
            onCopilot={() => setAiPanel({ section: 'actionPlan' })}
          >
            <div className="space-y-3">
              {(report.actionPlan || []).map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 border border-[#262626] bg-[#0A0A0A] hover:border-[var(--color-plan-30)] transition-colors group"
                >
                  <span className="font-serif text-2xl font-black text-[#262626] group-hover:text-[var(--color-plan)]/40 transition-colors leading-none mt-0.5 w-8 shrink-0">
                    {String(item.priority).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={item.action}
                          onChange={e => updateAction(i, 'action', e.target.value)}
                          placeholder="Descrição da ação..."
                          className="w-full bg-transparent font-sans text-sm text-[#F2EFE9] outline-none border border-[#262626] focus:border-[var(--color-plan)] transition-colors p-2 resize-none min-h-[52px]"
                        />
                        <div className="flex gap-3">
                          <input
                            value={item.deadline}
                            onChange={e => updateAction(i, 'deadline', e.target.value)}
                            placeholder="Prazo (ex: 30 dias)"
                            className="bg-transparent font-mono text-[10px] text-[#525252] placeholder-[#525252] outline-none border-b border-[#262626] focus:border-[var(--color-plan)] transition-colors flex-1 py-1"
                          />
                          <input
                            value={item.owner}
                            onChange={e => updateAction(i, 'owner', e.target.value)}
                            placeholder="Responsável"
                            className="bg-transparent font-mono text-[10px] text-[#525252] placeholder-[#525252] outline-none border-b border-[#262626] focus:border-[var(--color-plan)] transition-colors flex-1 py-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-sans text-sm text-[#F2EFE9] leading-snug mb-2">{item.action}</p>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[#525252]">
                            <Clock size={10} /> {item.deadline}
                          </span>
                          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[#525252]">
                            <User size={10} /> {item.owner}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => moveAction(i, -1)}
                        disabled={i === 0}
                        className="text-[#525252] hover:text-[#710CCD] transition-colors disabled:opacity-20"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => moveAction(i, 1)}
                        disabled={i === (report.actionPlan?.length || 0) - 1}
                        className="text-[#525252] hover:text-[#710CCD] transition-colors disabled:opacity-20"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        onClick={() => removeAction(i)}
                        className="text-[#525252] hover:text-[#ef4444] transition-colors mt-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {isEditing && (
              <button
                onClick={addAction}
                className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#737373] hover:text-[var(--color-plan)] border border-dashed border-[#262626] hover:border-[var(--color-plan)]/40 px-4 py-3 w-full justify-center transition-colors"
              >
                <Plus size={13} /> Adicionar Ação
              </button>
            )}
          </SectionCard>

          {/* ── 05 INSIGHTS ──────────────────────────────────────────────────────── */}
          <SectionCard
            label="05 // Insights Estratégicos"
            subtitle={`${insights.length} insights`}
            isEditing={isEditing}
            onCopilot={() => setAiPanel({ section: 'insights' })}
          >
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div key={i}>
                  {/* pill / cabeçalho */}
                  <div
                    onClick={() => !isEditing && setExpandedInsight(expandedInsight === i ? null : i)}
                    className={`flex items-center gap-2 border bg-[#0A0A0A] px-4 py-3 transition-all ${
                      !isEditing ? 'cursor-pointer hover:border-[var(--color-plan)]/40' : ''
                    } ${expandedInsight === i && !isEditing ? 'border-[var(--color-plan-50)]' : 'border-[#262626]'}`}
                  >
                    <BarChart2 size={11} className="text-[var(--color-plan)] shrink-0" />
                    {isEditing ? (
                      <input
                        value={insight.text}
                        onChange={e => updateInsight(i, 'text', e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="bg-transparent font-mono text-[10px] uppercase tracking-wider text-[#A3A3A3] outline-none border-b border-[#262626] focus:border-[var(--color-plan)] flex-1 transition-colors"
                      />
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#A3A3A3] flex-1">
                        {insight.text}
                      </span>
                    )}
                    {!isEditing && (
                      expandedInsight === i
                        ? <ChevronUp size={12} className="text-[var(--color-plan)] shrink-0" />
                        : <ChevronDown size={12} className="text-[#737373] shrink-0" />
                    )}
                    {isEditing && (
                      <button
                        onClick={e => { e.stopPropagation(); removeInsight(i); }}
                        className="text-[#525252] hover:text-[#ef4444] transition-colors shrink-0"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* painel expandido — modo leitura */}
                  {!isEditing && (
                    <AnimatePresence>
                      {expandedInsight === i && (
                        <motion.div
                          key="detail"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border border-t-0 border-[var(--color-plan-20)] bg-[var(--color-plan-05)] p-5 space-y-4">
                            {insight.detail ? (
                              <p className="font-sans text-sm text-[#A3A3A3] leading-relaxed">{insight.detail}</p>
                            ) : (
                              <p className="font-sans text-sm text-[#525252] italic">Nenhum detalhe disponível para este insight.</p>
                            )}
                            {insight.sources?.length > 0 && (
                              <div>
                                <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-plan)] mb-2">Fontes utilizadas:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {insight.sources.map((src, si) => (
                                    <span key={si} className="flex items-center gap-1 border border-[#262626] bg-[#0A0A0A] px-2 py-1 font-mono text-[9px] text-[#737373]">
                                      <FileText size={9} className="text-[#525252] shrink-0" /> {src}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}

                  {/* detalhe editável — modo edição */}
                  {isEditing && (
                    <div className="border border-t-0 border-[#262626] bg-[#0A0A0A] p-3">
                      <textarea
                        value={insight.detail || ''}
                        onChange={e => updateInsight(i, 'detail', e.target.value)}
                        placeholder="Detalhe / justificativa deste insight..."
                        className="w-full bg-transparent font-sans text-xs text-[#737373] placeholder-[#525252] outline-none border border-[#262626] focus:border-[var(--color-plan)] p-2 resize-none min-h-[56px] transition-colors"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {isEditing && (
              <button
                onClick={addInsight}
                className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#737373] hover:text-[var(--color-plan)] border border-dashed border-[#262626] hover:border-[var(--color-plan)]/40 px-4 py-3 w-full justify-center transition-colors"
              >
                <Plus size={13} /> Adicionar Insight
              </button>
            )}
          </SectionCard>

        </div>

        {/* ── COPILOTO DE IA ───────────────────────────────────────────────────── */}
        <AnimatePresence>
          {aiPanel && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
              className="lg:sticky lg:top-6 self-start border border-[var(--color-plan-30)] bg-[#101010] flex flex-col shadow-2xl"
            >
              {/* header */}
              <div className="border-b border-[#262626] p-4 flex items-center justify-between bg-[#0A0A0A]">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[var(--color-plan)]" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#F2EFE9]">
                    Copiloto — {SECTION_NAMES[aiPanel?.section]}
                  </span>
                </div>
                <button type="button" onClick={closeAiPanel} className="text-[#737373] hover:text-[var(--color-plan)]">
                  <X size={14} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* quick actions */}
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#737373] mb-3">Ações Rápidas</p>
                  <div className="flex flex-wrap gap-2">
                    {(COPILOT_ACTIONS[aiPanel?.section] || []).map(action => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => { setAiPrompt(action); handleAiAction(action); }}
                        disabled={isProcessingAI}
                        className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-plan)] border border-[var(--color-plan-30)] bg-[var(--color-plan-05)] hover:bg-[var(--color-plan-10)] px-2.5 py-1.5 transition-all disabled:opacity-40"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>

                {/* prompt livre */}
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373] block mb-2">
                    Instrução personalizada
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAiAction(aiPrompt)}
                      placeholder="Ex: Tom mais direto e orientado a dados..."
                      disabled={isProcessingAI}
                      className="flex-1 bg-[#0A0A0A] border border-[#262626] text-[#F2EFE9] px-3 py-2 font-mono text-[10px] focus:border-[var(--color-plan)] outline-none disabled:opacity-40"
                    />
                    <button
                      type="button"
                      onClick={() => handleAiAction(aiPrompt)}
                      disabled={isProcessingAI || !aiPrompt}
                      className="bg-[var(--color-plan)] text-[#0A0A0A] px-3 font-mono text-[10px] font-bold hover:bg-[#710CCD] transition-colors disabled:opacity-40 shrink-0"
                    >
                      {isProcessingAI ? <RefreshCw size={12} className="animate-spin" /> : '→'}
                    </button>
                  </div>
                </div>

                {/* estado de processamento */}
                {isProcessingAI && (
                  <div className="flex items-center gap-2 text-[#525252] font-mono text-[9px] uppercase tracking-widest">
                    <RefreshCw size={11} className="animate-spin" />
                    Processando...
                  </div>
                )}

                {/* rascunho editável */}
                {aiDraft && !isProcessingAI && (
                  <div className="space-y-3">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-plan)]">
                      Rascunho — edite antes de aplicar
                    </p>
                    <textarea
                      value={aiDraft}
                      onChange={e => setAiDraft(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#262626] text-[#F2EFE9] p-3 font-sans text-xs focus:border-[var(--color-plan)] outline-none resize-none min-h-[140px]"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={applyAiDraft}
                        disabled={aiPanel?.section === 'swot'}
                        className="flex-1 bg-[var(--color-plan)] text-[#0A0A0A] py-2 font-mono text-[9px] uppercase tracking-widest font-bold hover:bg-[#710CCD] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={aiPanel?.section === 'swot' ? 'SWOT é estruturado — edite manualmente a seção' : undefined}
                      >
                        Aplicar
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiDraft('')}
                        className="px-4 border border-[#262626] text-[#737373] font-mono text-[9px] uppercase tracking-widest hover:text-[#F2EFE9] transition-colors"
                      >
                        Descartar
                      </button>
                    </div>
                    {aiPanel?.section === 'swot' && (
                      <p className="font-mono text-[9px] text-[#525252]">
                        SWOT é estruturado — use como referência e edite manualmente os quadrantes.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
