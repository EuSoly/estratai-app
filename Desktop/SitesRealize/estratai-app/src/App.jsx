import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { supabase } from './supabaseClient';

import Navbar from './components/LandingPage/Navbar';
import Hero from './components/LandingPage/Hero';
import Ecosystem from './components/LandingPage/Ecosystem';
import Manifesto from './components/LandingPage/Manifesto';
import HowItWorks from './components/LandingPage/HowItWorks';
import Pricing from './components/LandingPage/Pricing';
import AuditTerminal from './components/LandingPage/AuditTerminal';
import Footer from './components/LandingPage/Footer';
import Dashboard from './components/dashboard/Dashboard';
import AuthScreen from './components/Auth/AuthScreen';
import { PlanColorProvider } from './contexts/PlanContext';
import { useTheme } from './contexts/ThemeContext';
import ExportPage from './components/StrategyRoom/ExportPage';
import AdminReportEditor from './components/AdminReportEditor';

function LandingPage({ onLoginClick, isLoggedIn }) {
  const { scrollYProgress } = useScroll();
  const gridY = useTransform(scrollYProgress, [0, 1], ['0%', '-20%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['-10%', '20%']);
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F2EFE9] font-sans selection:bg-[#842CD5] selection:text-[#0A0A0A] relative">
      <motion.div
        style={{ y: textY }}
        style={{ opacity: isDark ? 0.012 : 0.035 }}
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden"
      >
        <span className="font-serif font-black text-[25vw] leading-none whitespace-nowrap text-[#F2EFE9] select-none">
          Estrat-AI
        </span>
      </motion.div>

      <motion.div
        style={{
          y: gridY,
          backgroundImage: isDark
            ? 'linear-gradient(#262626 1px, transparent 1px), linear-gradient(90deg, #262626 1px, transparent 1px)'
            : 'linear-gradient(#C8C5BF 1px, transparent 1px), linear-gradient(90deg, #C8C5BF 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          opacity: isDark ? 0.35 : 0.35
        }}
        className="fixed -top-[50%] left-0 right-0 h-[200%] pointer-events-none z-0"
      />

      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none z-0"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />

      <Navbar onLoginClick={onLoginClick} isLoggedIn={isLoggedIn} />

      <main className="relative z-10">
        <Hero />
        <Ecosystem />
        <Manifesto />
        <HowItWorks />
        <Pricing />
        <AuditTerminal />
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  // undefined = ainda carregando | null = sem sessão | Session = logado
  const [session, setSession] = useState(undefined);
  const [userPlan, setUserPlan] = useState('Starter');
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Restaura sessão existente ao carregar a página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
      if (session) fetchPlan(session.user.id);
    });

    // Escuta mudanças de auth em tempo real (login, logout, expiração de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      if (!session) setUserPlan('Starter');
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPlan = async (userId) => {
    const { data } = await supabase.from('profiles').select('plan').eq('id', userId).single();
    setUserPlan(data?.plan || 'Starter');
  };

  const handleLoginSuccess = (_user, plan) => {
    setUserPlan(plan);
    setShowAuth(false);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Tela de carregamento enquanto verifica a sessão
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#842CD5] animate-ping" />
          <span className="font-mono text-xs uppercase tracking-widest text-[#525252] animate-pulse">
            Inicializando Sistema_
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Rota raiz: landing page sempre acessível */}
        <Route
          path="/"
          element={
            <LandingPage
              onLoginClick={session ? () => navigate('/dashboard') : () => setShowAuth(true)}
              isLoggedIn={!!session}
            />
          }
        />

        {/* Rota do dashboard (e sub-rotas): protegida por sessão */}
        <Route
          path="/dashboard/*"
          element={
            session
              ? <PlanColorProvider plan={userPlan}><Dashboard userPlan={userPlan} onLogout={handleLogout} /></PlanColorProvider>
              : <Navigate to="/" replace />
          }
        />

        {/* Página de exportação PDF — abre em nova aba a partir do EditorTab */}
        <Route
          path="/relatorio/:id"
          element={session ? <ExportPage /> : <Navigate to="/" replace />}
        />

        {/* ROTA ADMIN WOZ — TEMPORÁRIA */}
        <Route
          path="/admin/:projectId"
          element={session ? <AdminReportEditor /> : <Navigate to="/" replace />}
        />

        {/* Qualquer outra URL volta para a raiz */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showAuth && !session && (
        <AuthScreen
          onClose={() => setShowAuth(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

    </>
  );
}
