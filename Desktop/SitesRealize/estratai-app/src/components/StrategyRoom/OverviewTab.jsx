import React, { useState, useEffect } from 'react';
import { Target, Cpu, Play, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { supabase } from '../../supabaseClient';

import { PLAN_LEVELS, getPlanColor } from '../../constants/plans';

// Validar schema do report_data retornado pelo webhook
const validateReportData = (data) => {
  if (!data || typeof data !== 'object') return false;
  // Schema esperado: agentName, score, executiveSummary, swot, risks, actionPlan, insights
  const requiredFields = ['agentName', 'score'];
  return requiredFields.every(field => field in data);
};

export default function OverviewTab({ project, userPlan = 'Starter' }) {
  const [strategy, setStrategy] = useState("");
  const [agentId, setAgentId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    async function loadData() {
      if (project) await fetchProjectSettings();
      await Promise.all([fetchAgents(), fetchWebhookUrl()]);
    }
    loadData();
  }, [project]);

  const fetchWebhookUrl = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('webhook_url')
      .eq('id', user.id)
      .single();
    if (data?.webhook_url) setWebhookUrl(data.webhook_url);
  };

  const fetchProjectSettings = async () => {
    const { data } = await supabase
      .from('projects')
      .select('project_strategy, agent_id, status')
      .eq('id', project.id)
      .single();

    if (data) {
      if (data.project_strategy) setStrategy(data.project_strategy);
      if (data.agent_id) setAgentId(data.agent_id);
    }
  };

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (!error && data) setAvailableAgents(data);
  };

  const saveSettings = async (updatedFields) => {
    setIsSaving(true);
    await supabase.from('projects').update(updatedFields).eq('id', project.id);
    setIsSaving(false);
  };

  const handleAgentSelection = async (id) => {
    setAgentId(id);
    await saveSettings({ agent_id: id });
  };

  const startAnalysis = async () => {
    await saveSettings({ project_strategy: strategy, agent_id: agentId });
    setIsStarting(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Sessão expirada. Faça login novamente para iniciar a auditoria.");
        setIsStarting(false);
        return;
      }

      if (!webhookUrl) {
        alert("Configure a URL do webhook n8n em Configurações → Integrações antes de iniciar.");
        setIsStarting(false);
        return;
      }

      // Validar URL do webhook
      try {
        new URL(webhookUrl);
      } catch (e) {
        alert("URL do webhook inválida. Verifique em Configurações → Integrações.");
        setIsStarting(false);
        return;
      }

      const payload = {
        userId: user.id,
        projectId: project.id,
        agentId: agentId,
        strategy: strategy
      };

      // Fetch com timeout de 30 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Webhook retornou erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Validar schema do report_data antes de salvar
      if (result?.report_data) {
        if (!validateReportData(result.report_data)) {
          console.warn('Report data schema inválido:', result.report_data);
          alert("Aviso: Resposta do webhook tem formato inesperado. Dados não foram salvos.");
          setIsStarting(false);
          return;
        }

        await supabase
          .from('projects')
          .update({ report_data: result.report_data })
          .eq('id', project.id);
      }

      alert("Motor de IA Inicializado! Dados enviados ao n8n com sucesso.");
    } catch (error) {
      console.error("Erro ao disparar auditoria:", error);

      let errorMessage = "Houve um erro ao iniciar a auditoria.";
      if (error.name === 'AbortError') {
        errorMessage = "Timeout: Webhook demorou muito para responder (máx 30s).";
      } else if (error instanceof TypeError) {
        errorMessage = "Erro de conexão: Verifique a URL do webhook e sua conexão de internet.";
      } else if (error?.message?.includes("Webhook retornou erro")) {
        errorMessage = `O servidor respondeu com erro: ${error.message}`;
      } else if (error?.message) {
        errorMessage = `Erro: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setIsStarting(false);
    }
  };

  const selectedAgentObj = availableAgents.find(a => a.id === agentId);
  const selectedAgentName = selectedAgentObj ? selectedAgentObj.name : "Nenhum selecionado";
  const userLevel = PLAN_LEVELS[userPlan] || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto text-left">
      <div className="lg:col-span-8 space-y-6">

        {/* SELETOR DE AGENTE */}
        <div className="border border-[#262626] bg-[#101010] p-8">
          <div className="flex items-center gap-3 mb-6">
            <Cpu className="text-[var(--color-plan)]" size={20} />
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#F2EFE9]">Agente de Inteligência</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableAgents.map(agent => {
              const isSelected = agentId === agent.id;
              const agentLevel = PLAN_LEVELS[agent.plan_required] || 1;
              const isLocked = userLevel < agentLevel;

              return (
                <div
                  key={agent.id}
                  onClick={() => !isLocked && handleAgentSelection(agent.id)}
                  className={`p-4 border transition-all relative flex flex-col justify-between ${
                    isLocked
                      ? 'border-[#262626] bg-[#0A0A0A] opacity-50 cursor-not-allowed'
                      : isSelected
                        ? 'border-[var(--color-plan)] bg-[var(--color-plan-10)] cursor-pointer'
                        : 'border-[#262626] bg-[#0A0A0A] hover:border-[#525252] cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-mono text-[10px] uppercase font-bold ${isSelected ? 'text-[var(--color-plan)]' : 'text-[#F2EFE9]'}`}>
                        {agent.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        {isLocked && <Lock size={14} className="text-[#525252]" />}
                        {isSelected && <CheckCircle2 size={14} className="text-[var(--color-plan)]" />}
                      </div>
                    </div>
                    <p className="text-[#737373] text-xs font-sans mb-3">{agent.description}</p>
                  </div>
                  {isLocked && (
                    <div className="mt-auto">
                      {(() => {
                        const c = getPlanColor(agent.plan_required);
                        return (
                          <span
                            className="font-mono text-[8px] uppercase px-2 py-1 inline-block"
                            style={{ color: c.hex, backgroundColor: c.bg, border: `1px solid ${c.border}` }}
                          >
                            Plano {agent.plan_required}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* DIRETRIZES DO PROJETO */}
        <div className="border border-[#262626] bg-[#101010] p-8">
          <div className="flex items-center gap-3 mb-6">
            <Target className="text-[var(--color-plan)]" size={20} />
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#F2EFE9]">Diretrizes do Projeto</h3>
          </div>
          <textarea
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            onBlur={() => saveSettings({ project_strategy: strategy })}
            placeholder="Ex: Focar na transformação digital com abordagem ágil e iterativa..."
            className="w-full bg-[#0A0A0A] border border-[#262626] p-4 text-[#F2EFE9] font-sans text-sm focus:border-[var(--color-plan)] outline-none min-h-[120px] resize-none"
          />
          <div className="flex items-center gap-2 mt-3">
            <p className="text-[10px] font-mono text-[#525252] uppercase italic">* Salvamento Automático Ativo</p>
            {isSaving && <Loader2 size={10} className="animate-spin text-[var(--color-plan)]" />}
          </div>
        </div>
      </div>

      {/* COLUNA DIREITA: STATUS E START */}
      <div className="lg:col-span-4">
        <div className="sticky top-6 border border-[#262626] bg-[#101010] p-6 flex flex-col gap-6 shadow-xl">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#F2EFE9] mb-2">Status da Operação</h3>
            <p className="font-sans text-sm text-[#737373]">Verifique se os arquivos no "Cofre" estão classificados corretamente antes de disparar.</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono uppercase">
              <span className="text-[#525252]">Plano:</span>
              <span className="font-bold" style={{ color: getPlanColor(userPlan).hex }}>{userPlan}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono uppercase">
              <span className="text-[#525252]">Agente:</span>
              <span className="text-[var(--color-plan)] text-right ml-4 truncate">{selectedAgentName}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono uppercase">
              <span className="text-[#525252]">Estratégia:</span>
              <span className={strategy ? "text-green-500" : "text-yellow-600"}>{strategy ? "Definida" : "Pendente"}</span>
            </div>
          </div>

          <button
            onClick={startAnalysis}
            disabled={isStarting || !agentId}
            className="w-full bg-[var(--color-plan)] text-[#0A0A0A] px-6 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-[#710CCD] transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isStarting
              ? <><Loader2 size={16} className="animate-spin" /> Processando...</>
              : <><Play size={16} fill="currentColor" /> Iniciar Auditoria IA</>}
          </button>
        </div>
      </div>
    </div>
  );
}
