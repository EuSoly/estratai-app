import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Printer, RefreshCw, Check,
  TrendingUp, TrendingDown, Zap, ShieldAlert,
  AlertTriangle, AlertCircle, Info, CheckCircle2,
  ChevronRight, User, Clock, BarChart2, FileText,
} from 'lucide-react';

function toInsightObj(insight) {
  if (typeof insight === 'string') return { text: insight, detail: '', sources: [] };
  return { text: '', detail: '', sources: [], ...insight };
}

// ─── Mock idêntico ao EditorTab (fonte de dados quando report_data está vazio) ──
const MOCK_REPORT = {
  generatedAt: '2026-06-01T14:30:00Z',
  agentName: 'Auditor Estratégico v2',
  score: 72,
  contextFiles: ['relatorio-financeiro-q1.pdf', 'pesquisa-mercado-latam.xlsx', 'nps-pesquisa-clientes.pdf', 'roadmap-produto-2026.pdf'],
  executiveSummary:
    'A empresa apresenta uma base operacional sólida, com processos documentados e equipe alinhada aos objetivos táticos de curto prazo. A ausência de visão estratégica de médio prazo e a dependência excessiva de um único canal de aquisição representam os vetores de risco mais críticos identificados. A janela de oportunidade no segmento B2B enterprise está se fechando nos próximos 6 meses, exigindo decisão imediata sobre posicionamento e priorização de recursos.',
  swot: {
    strengths:     ['Produto com NPS acima da média do mercado (72)', 'Time técnico sênior com baixo turnover histórico', 'Margem bruta saudável de 68% — referência no setor'],
    weaknesses:    ['Dependência de 80% da receita em apenas 3 clientes', 'Ausência de processo de vendas estruturado e documentado', 'Stack legada no módulo financeiro aumenta custo de manutenção'],
    opportunities: ['Expansão LATAM com baixa concorrência nos próximos 6 meses', 'Regulamentação favorável cria barreira de entrada significativa', 'Parceria estratégica com distribuidor regional em negociação'],
    threats:       ['Entrante bem capitalizado anunciado para entrada em Q3', 'Pressão de pricing de concorrente asiático no tier mid-market', 'Instabilidade cambial impacta contratos denominados em USD'],
  },
  risks: [
    { id: 1, severity: 'critical', title: 'Concentração de Receita',          description: 'Top 3 clientes representam 80% do ARR. Perda de qualquer um impacta o runway em até 8 meses.' },
    { id: 2, severity: 'high',     title: 'Ausência de Pipeline Estruturado',  description: 'Sem funil de vendas previsível, a empresa não consegue projetar crescimento com confiança.' },
    { id: 3, severity: 'medium',   title: 'Dívida Técnica no Módulo Financeiro',description: 'Stack legada aumenta custo de manutenção em 40% e bloqueia integrações estratégicas.' },
    { id: 4, severity: 'low',      title: 'Exposição Cambial sem Hedge',        description: 'Contratos em USD sem proteção expõem a margem a variações acima de 10%.' },
  ],
  actionPlan: [
    { priority: 1, action: 'Diversificar base de clientes — meta: concentração < 50% em 12 meses', deadline: '12 meses', owner: 'CEO + Vendas' },
    { priority: 2, action: 'Implementar CRM e playbook de vendas documentado', deadline: '60 dias', owner: 'Head de Vendas' },
    { priority: 3, action: 'Iniciar due diligence da parceria com distribuidor LATAM', deadline: '30 dias', owner: 'CEO' },
    { priority: 4, action: 'Migração do módulo financeiro — roadmap e orçamento aprovados', deadline: '90 dias', owner: 'CTO' },
  ],
  insights: [
    { text: 'PMF validado — problema é go-to-market',             detail: 'O produto tem retenção acima de 85% e NPS 72. O gargalo está em aquisição e ativação, não em produto.', sources: ['nps-pesquisa-clientes.pdf'] },
    { text: 'Crescimento bloqueado por vendas, não produto',       detail: 'A análise do pipeline mostra que 72% das oportunidades se perdem na fase de qualificação por falta de processo estruturado.', sources: ['relatorio-financeiro-q1.pdf'] },
    { text: 'Janela LATAM: 6 meses de vantagem',                  detail: 'O principal concorrente ainda não tem presença local na América Latina. A regulamentação favorável cria uma janela de 6 meses.', sources: ['pesquisa-mercado-latam.xlsx'] },
    { text: 'Fundraise acelerado com pipeline estruturado',        detail: 'Investidores requerem previsibilidade de receita. Com pipeline estruturado e MRR crescendo, o fundraise fica viável em Q3.', sources: ['relatorio-financeiro-q1.pdf', 'roadmap-produto-2026.pdf'] },
  ],
};

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

const SECTIONS = [
  { key: 'score',            label: 'Índice de Saúde' },
  { key: 'executiveSummary', label: 'Diagnóstico Executivo' },
  { key: 'swot',             label: 'Matriz SWOT' },
  { key: 'risks',            label: 'Vetores de Risco' },
  { key: 'actionPlan',       label: 'Plano de Ação' },
  { key: 'insights',         label: 'Insights Estratégicos' },
];

// ─── Componentes de UI da preview ────────────────────────────────────────────

function SectionBlock({ label, children }) {
  return (
    <div className="border border-[#262626] bg-[#101010] p-8 break-inside-avoid">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-4 bg-[var(--color-plan)]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#737373]">{label}</span>
      </div>
      {children}
    </div>
  );
}

function ScoreBlock({ score }) {
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#eab308' : '#ef4444';
  const label = score >= 70 ? 'Saudável' : score >= 50 ? 'Atenção' : 'Crítico';
  return (
    <SectionBlock label="Índice de Saúde Estratégica">
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
            <div className="h-full" style={{ width: `${score}%`, backgroundColor: color }} />
          </div>
        </div>
      </div>
    </SectionBlock>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ExportPage() {
  const { id } = useParams();
  const [report, setReport]           = useState(null);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(
    Object.fromEntries(SECTIONS.map(s => [s.key, true]))
  );

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('projects')
        .select('name, report_data')
        .eq('id', id)
        .single();

      if (data) {
        setProjectName(data.name || 'Projeto');
        setReport(data.report_data && Object.keys(data.report_data).length > 0
          ? data.report_data
          : MOCK_REPORT);
      }
    } catch {
      setReport(MOCK_REPORT);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key) => setSelected(s => ({ ...s, [key]: !s[key] }));
  const allSelected = SECTIONS.every(s => selected[s.key]);
  const toggleAll   = () =>
    setSelected(Object.fromEntries(SECTIONS.map(s => [s.key, !allSelected])));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw size={20} className="text-[var(--color-plan)] animate-spin" />
          <span className="font-mono text-xs uppercase tracking-widest text-[#525252]">Preparando relatório_</span>
        </div>
      </div>
    );
  }

  const insights = (report?.insights || []).map(toInsightObj);
  const generatedDate = report?.generatedAt
    ? new Date(report.generatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  return (
    <>
      {/* ── CSS de impressão ─────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: #0A0A0A; }
          .print-main { padding: 0 !important; }
          * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          @page { margin: 12mm; }
        }
      `}</style>

      <div className="min-h-screen bg-[#0A0A0A] text-[#F2EFE9] font-sans flex">

        {/* ── SIDEBAR DE CONTROLES (oculta ao imprimir) ─────────────────────── */}
        <aside className="no-print w-72 shrink-0 border-r border-[#262626] bg-[#050505] sticky top-0 h-screen flex flex-col overflow-hidden">

          {/* cabeçalho da sidebar */}
          <div className="border-b border-[#262626] p-6 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-[var(--color-plan)]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#737373]">Exportar Relatório</span>
            </div>
            <p className="font-serif text-base font-black uppercase text-[#F2EFE9] leading-tight">{projectName}.</p>
            {report?.agentName && (
              <p className="font-mono text-[10px] text-[#525252] mt-1">{report.agentName}</p>
            )}
          </div>

          {/* seletor de seções */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">Seções do relatório</span>
              <button
                onClick={toggleAll}
                className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-plan)] hover:text-[#710CCD] transition-colors"
              >
                {allSelected ? 'Limpar' : 'Todos'}
              </button>
            </div>

            <div className="space-y-1.5">
              {SECTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 border text-left transition-all ${
                    selected[key]
                      ? 'border-[var(--color-plan)]/40 bg-[var(--color-plan-05)]'
                      : 'border-[#262626] hover:border-[#3a3a3a]'
                  }`}
                >
                  <div className={`w-4 h-4 border flex items-center justify-center shrink-0 transition-colors ${
                    selected[key] ? 'border-[var(--color-plan)] bg-[var(--color-plan)]' : 'border-[#525252]'
                  }`}>
                    {selected[key] && <Check size={10} className="text-[#0A0A0A]" />}
                  </div>
                  <span className={`font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    selected[key] ? 'text-[#F2EFE9]' : 'text-[#525252]'
                  }`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* arquivos de contexto */}
            {report?.contextFiles?.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[#262626]">
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#737373] mb-3">
                  Arquivos analisados
                </p>
                <div className="space-y-1.5">
                  {report.contextFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <FileText size={10} className="text-[#525252] shrink-0" />
                      <span className="font-mono text-[9px] text-[#525252] truncate">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* botão de impressão */}
          <div className="border-t border-[#262626] p-6 shrink-0">
            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-plan)] text-[#0A0A0A] py-4 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-[#710CCD] transition-colors"
            >
              <Printer size={14} /> Imprimir / Salvar PDF
            </button>
            <p className="font-mono text-[9px] text-[#525252] text-center mt-3 leading-snug">
              No diálogo de impressão, selecione <span className="text-[#737373]">"Salvar como PDF"</span> e ative <span className="text-[#737373]">"Gráficos em segundo plano"</span>.
            </p>
          </div>
        </aside>

        {/* ── ÁREA DE PREVIEW / IMPRESSÃO ──────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="print-main max-w-4xl mx-auto p-10 space-y-6">

            {/* cabeçalho do relatório — sempre incluído */}
            <div className="border-b border-[#262626] pb-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-plan)] mb-2">
                    Relatório Estratégico
                  </p>
                  <h1 className="font-serif text-4xl font-black uppercase text-[#F2EFE9] leading-tight">
                    {projectName}.
                  </h1>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="font-mono text-[10px] text-[#525252] uppercase">{report?.agentName}</span>
                    <span className="font-mono text-[10px] text-[#262626]">//</span>
                    <span className="font-mono text-[10px] text-[#525252] uppercase">{generatedDate}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#525252]">Gerado por</p>
                  <p className="font-serif text-2xl font-black text-[var(--color-plan)]">ESTRAT.AI</p>
                </div>
              </div>
            </div>

            {/* ── score ── */}
            {selected.score && <ScoreBlock score={report?.score ?? 0} />}

            {/* ── diagnóstico executivo ── */}
            {selected.executiveSummary && report?.executiveSummary && (
              <SectionBlock label="01 // Diagnóstico Executivo">
                <p className="font-serif text-xl text-[#F2EFE9] leading-loose">
                  {report.executiveSummary}
                </p>
              </SectionBlock>
            )}

            {/* ── swot ── */}
            {selected.swot && report?.swot && (
              <SectionBlock label="02 // Matriz de Diagnóstico SWOT">
                <div className="grid grid-cols-2 gap-4">
                  {SWOT_CONFIG.map(({ key, label, Icon, accent }) => (
                    <div
                      key={key}
                      className="border border-[#262626] p-5"
                      style={{ borderLeftColor: accent, borderLeftWidth: '2px' }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Icon size={13} style={{ color: accent }} />
                        <span className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>
                          {label}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {(report.swot[key] || []).map((item, i) => (
                          <li key={i} className="flex items-start gap-2 font-sans text-sm text-[#A3A3A3] leading-snug">
                            <ChevronRight size={11} className="mt-0.5 shrink-0" style={{ color: accent }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SectionBlock>
            )}

            {/* ── riscos ── */}
            {selected.risks && (report?.risks || []).length > 0 && (
              <SectionBlock label="03 // Vetores de Risco Ativos">
                <div className="space-y-3">
                  {report.risks.map(risk => {
                    const cfg = SEVERITY_CONFIG[risk.severity] || SEVERITY_CONFIG.low;
                    const { Icon } = cfg;
                    return (
                      <div
                        key={risk.id}
                        className="flex items-start gap-4 p-4 border border-[#262626]"
                        style={{ backgroundColor: cfg.bg, borderLeftColor: cfg.color, borderLeftWidth: '2px' }}
                      >
                        <Icon size={15} className="mt-0.5 shrink-0" style={{ color: cfg.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
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
                    );
                  })}
                </div>
              </SectionBlock>
            )}

            {/* ── plano de ação ── */}
            {selected.actionPlan && (report?.actionPlan || []).length > 0 && (
              <SectionBlock label="04 // Plano de Ação Tático">
                <div className="space-y-3">
                  {report.actionPlan.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 border border-[#262626] bg-[#0A0A0A]">
                      <span className="font-serif text-2xl font-black text-[#262626] leading-none mt-0.5 w-8 shrink-0">
                        {String(item.priority).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm text-[#F2EFE9] leading-snug mb-2">{item.action}</p>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[#525252]">
                            <Clock size={10} /> {item.deadline}
                          </span>
                          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[#525252]">
                            <User size={10} /> {item.owner}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionBlock>
            )}

            {/* ── insights ── */}
            {selected.insights && insights.length > 0 && (
              <SectionBlock label="05 // Insights Estratégicos">
                <div className="space-y-2">
                  {insights.map((insight, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 border border-[#262626] bg-[#0A0A0A] px-4 py-3">
                        <BarChart2 size={11} className="text-[var(--color-plan)] shrink-0" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#A3A3A3]">
                          {insight.text}
                        </span>
                      </div>
                      {insight.detail && (
                        <div className="border border-t-0 border-[var(--color-plan-20)] bg-[var(--color-plan-05)] px-5 py-3 space-y-2">
                          <p className="font-sans text-sm text-[#A3A3A3] leading-relaxed">{insight.detail}</p>
                          {insight.sources?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {insight.sources.map((src, si) => (
                                <span key={si} className="flex items-center gap-1 border border-[#262626] bg-[#0A0A0A] px-2 py-0.5 font-mono text-[9px] text-[#737373]">
                                  <FileText size={9} className="text-[#525252] shrink-0" /> {src}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SectionBlock>
            )}

            {/* rodapé do relatório */}
            <div className="border-t border-[#262626] pt-6 flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#525252]">
                Documento gerado pelo Estrat-AI — confidencial
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#525252]">{generatedDate}</span>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
