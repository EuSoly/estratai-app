import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, FileUp, Cpu, ChevronRight, Settings, LogOut } from 'lucide-react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';

import DashboardOverview from './DashboardOverview';
import DashboardInjection from './DashboardInjection';
import DashboardAgents from './DashboardAgents';
import DashboardSettings from './DashboardSettings';
import DashboardStrategyRoom from '../StrategyRoom';
import { getPlanColor } from '../../constants/plans';

const TAB_PATHS = {
  'visao-geral':    '/dashboard',
  'injecao':        '/dashboard/dados',
  'agentes':        '/dashboard/agentes',
  'configuracoes':  '/dashboard/configuracoes',
};

const menuItems = [
  { id: 'visao-geral', label: 'Visão Geral',       icon: LayoutDashboard },
  { id: 'injecao',     label: 'Injeção de Dados',  icon: FileUp },
  { id: 'agentes',     label: 'Matriz de Agentes', icon: Cpu },
];

function getActiveTab(pathname) {
  if (pathname.startsWith('/dashboard/dados'))          return 'injecao';
  if (pathname.startsWith('/dashboard/agentes'))        return 'agentes';
  if (pathname.startsWith('/dashboard/configuracoes'))  return 'configuracoes';
  return 'visao-geral';
}

export default function Dashboard({ onLogout, userPlan = 'Starter' }) {
  const navigate   = useNavigate();
  const location   = useLocation();

  const isStrategyRoom = location.pathname.startsWith('/dashboard/estrategia/');
  const selectedProject = isStrategyRoom ? (location.state?.project ?? null) : null;
  const activeTab = getActiveTab(location.pathname);

  // Se a URL aponta para a sala de estratégia mas o state foi perdido
  // (ex: F5 na página), redireciona para o dashboard
  if (isStrategyRoom && !selectedProject) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSelectProject = (project) => {
    navigate('/dashboard/estrategia/' + project.id, { state: { project } });
  };

  const renderContent = () => {
    if (isStrategyRoom) {
      return (
        <DashboardStrategyRoom
          project={selectedProject}
          onBack={() => navigate('/dashboard')}
          userPlan={userPlan}
        />
      );
    }

    switch (activeTab) {
      case 'visao-geral':
        return <DashboardOverview onSelectProject={handleSelectProject} userPlan={userPlan} />;
      case 'injecao':
        return <DashboardInjection />;
      case 'agentes':
        return <DashboardAgents userPlan={userPlan} />;
      case 'configuracoes':
        return <DashboardSettings userPlan={userPlan} />;
      default:
        return <DashboardOverview onSelectProject={handleSelectProject} userPlan={userPlan} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex text-[#F2EFE9] font-sans selection:bg-[#842CD5] selection:text-[#0A0A0A]">

      {/* SIDEBAR */}
      <aside className="w-72 border-r border-[#262626] bg-[#050505] flex flex-col sticky top-0 h-screen z-20">
        <div className="p-8 border-b border-[#262626]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-[#842CD5] animate-pulse" />
            <span className="font-serif font-black text-2xl tracking-tighter uppercase">Estrat. AI</span>
          </div>
          <span className="font-mono text-[10px] text-[#525252] uppercase tracking-[0.3em]">Operational_v2.0</span>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id && !isStrategyRoom;
            return (
              <button
                key={item.id}
                onClick={() => navigate(TAB_PATHS[item.id])}
                className={`w-full flex items-center justify-between p-4 group transition-all ${
                  isActive
                    ? 'bg-[#842CD5] text-[#0A0A0A]'
                    : 'text-[#737373] hover:text-[#710CCD] hover:bg-[#101010]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={18} className={isActive ? 'text-[#0A0A0A]' : 'group-hover:text-[#842CD5]'} />
                  <span className="font-mono text-[10px] uppercase tracking-widest font-bold">{item.label}</span>
                </div>
                <ChevronRight size={14} className={isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'} />
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[#262626] space-y-2">
          <div className="px-4 py-2 mb-4 bg-[#101010] border border-[#262626] rounded-sm flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#737373] uppercase tracking-widest">Plano Ativo</span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: getPlanColor(userPlan).hex }}>{userPlan}</span>
          </div>

          <button
            onClick={() => navigate(TAB_PATHS['configuracoes'])}
            className={`flex items-center gap-4 px-4 py-3 font-mono text-xs uppercase tracking-widest w-full transition-colors text-left ${
              activeTab === 'configuracoes'
                ? 'text-[#F2EFE9] bg-[#101010]'
                : 'text-[#737373] hover:text-[#710CCD]'
            }`}
          >
            <Settings className="w-4 h-4" /> Configurações
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-4 px-4 py-3 font-mono text-xs uppercase tracking-widest text-[#737373] hover:text-[#842CD5] w-full transition-colors text-left"
          >
            <LogOut className="w-4 h-4" /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="h-20 border-b border-[#262626] bg-[#0A0A0A]/90 backdrop-blur-md sticky top-0 z-10 flex items-center px-10">
          <span className="font-mono text-xs uppercase tracking-widest text-[#737373]">
            Terminal //{' '}
            {isStrategyRoom
              ? `Sala de Estratégia // ${selectedProject.name}`
              : menuItems.find(m => m.id === activeTab)?.label}
          </span>
        </header>

        <div className="p-10 max-w-6xl mx-auto relative z-10">
          {renderContent()}
        </div>

        <div
          className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
          style={{ backgroundImage: 'radial-gradient(#F2EFE9 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </main>

    </div>
  );
}
