import React from 'react';
import { Zap, LogIn, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function Navbar({ onLoginClick, isLoggedIn = false }) {
  const { isDark, toggleTheme } = useTheme();

  const scrollToAudit = (e) => {
    e.preventDefault();
    document.getElementById('motor-auditoria')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-[#262626] bg-[#0A0A0A]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[#842CD5]" />
          <span className="font-serif font-black text-2xl tracking-tighter uppercase text-[#F2EFE9]">Estrat. AI</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={scrollToAudit}
            className="hidden md:flex font-nunito text-xs uppercase tracking-widest font-bold text-[#A3A3A3] hover:text-[#842CD5] transition-colors items-center gap-2"
          >
            Iniciar Auditoria <Zap size={16} />
          </button>

          {/* Toggle dark/light */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Modo Claro' : 'Modo Escuro'}
            className="w-9 h-9 flex items-center justify-center border border-[#262626] text-[#737373] hover:text-[#842CD5] hover:border-[#842CD5] transition-colors"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            onClick={onLoginClick}
            className="border border-[#262626] bg-[#101010] text-[#F2EFE9] font-nunito text-[10px] uppercase tracking-widest py-2 px-4 hover:border-[#842CD5] hover:text-[#842CD5] transition-colors flex items-center gap-2"
          >
            {isLoggedIn
              ? <><LayoutDashboard size={14} /> Ir ao Painel</>
              : <><LogIn size={14} /> Painel do Cliente</>}
          </button>
        </div>
      </div>
    </nav>
  );
}
