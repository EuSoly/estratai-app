import React, { useState } from 'react';
import { ArrowLeft, LayoutDashboard, Database, FileSignature, Lock } from 'lucide-react';

import OverviewTab from './OverviewTab';
import EditorTab from './EditorTab';
import ContextGravity from './ContextGravity';
import { PLAN_LEVELS, getPlanColor } from '../../constants/plans';

function PlanLockScreen({ requiredPlan }) {
  const c = getPlanColor(requiredPlan);
  return (
    <div className="flex flex-col items-center justify-center py-32 border border-dashed border-[#262626] bg-[#050505] text-center">
      <div className="w-16 h-16 border border-[#262626] flex items-center justify-center mb-6">
        <Lock size={28} className="text-[#525252]" />
      </div>
      <h2 className="font-serif text-2xl font-black uppercase text-[#F2EFE9] mb-2">
        Acesso Restrito
      </h2>
      <p className="font-mono text-xs text-[#737373] uppercase tracking-widest max-w-sm mb-6">
        Esta funcionalidade requer o plano{' '}
        <span className="font-bold" style={{ color: c.hex }}>{requiredPlan}</span> ou superior.
      </p>
      <div className="px-8 py-4" style={{ border: `1px solid ${c.border}`, backgroundColor: c.bg }}>
        <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: c.hex }}>
          Fale com o comercial para fazer upgrade
        </p>
      </div>
    </div>
  );
}

export default function DashboardStrategyRoom({ project, onBack, userPlan = 'Starter' }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!project) return null;

  const userLevel = PLAN_LEVELS[userPlan] || 1;
  const canAccessFiles  = userLevel >= PLAN_LEVELS['Business'];
  const canAccessEditor = userLevel >= PLAN_LEVELS['Business'];

  const tabs = [
    { id: 'overview', label: 'Sala de Controle',  icon: LayoutDashboard, locked: false },
    { id: 'files',    label: 'Cofre de Contexto', icon: Database,        locked: !canAccessFiles,  requiredPlan: 'Business' },
    { id: 'editor',   label: 'Editor Neural',      icon: FileSignature,   locked: !canAccessEditor, requiredPlan: 'Business' },
  ];

  return (
    <div className="space-y-6 relative min-h-screen flex flex-col pb-10">

      {/* HEADER GLOBAL DO PROJETO */}
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
              {project.name}
            </h1>
            <p className="font-mono text-xs text-[#737373]">
              ID_VETOR: // {project.id}
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO INTERNA */}
        <div className="flex bg-[#050505] border border-[#262626] p-1 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--color-plan)] text-[#0A0A0A] font-bold'
                  : tab.locked
                    ? 'text-[#525252] hover:text-[#737373]'
                    : 'text-[#737373] hover:text-[#710CCD]'
              }`}
            >
              {tab.locked ? <Lock size={14} /> : <tab.icon size={14} />}
              {tab.label}
              {tab.locked && activeTab !== tab.id && (() => {
                const c = getPlanColor(tab.requiredPlan);
                return (
                  <span
                    className="ml-1 font-mono text-[8px] uppercase px-1 py-0.5"
                    style={{ color: c.hex, backgroundColor: c.bg, border: `1px solid ${c.border}` }}
                  >
                    {tab.requiredPlan}+
                  </span>
                );
              })()}
            </button>
          ))}
        </div>
      </div>

      {/* CONTEÚDO DA ABA */}
      <div className="flex-1 mt-4">
        {activeTab === 'overview' && (
          <div className="border border-[#262626] p-12 text-center text-[#737373] font-mono">
            <OverviewTab project={project} userPlan={userPlan} />
          </div>
        )}

        {activeTab === 'files' && (
          canAccessFiles
            ? <div className="w-full"><ContextGravity projectId={project.id} /></div>
            : <PlanLockScreen requiredPlan="Business" />
        )}

        {activeTab === 'editor' && (
          canAccessEditor
            ? <div className="border border-[#262626] p-12 text-center text-[#737373] font-mono">
                <EditorTab project={project} />
              </div>
            : <PlanLockScreen requiredPlan="Business" />
        )}
      </div>

    </div>
  );
}
