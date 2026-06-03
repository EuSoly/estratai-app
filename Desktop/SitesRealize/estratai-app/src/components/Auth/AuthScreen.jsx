import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, KeyRound, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';

export default function AuthScreen({ onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isDark } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user) {
          let { data: profile } = await supabase.from('profiles').select('plan').eq('id', data.user.id).single();
          if (!profile) {
            await supabase.from('profiles').insert([{ id: data.user.id, plan: 'Starter' }]);
            profile = { plan: 'Starter' };
          }
          onLoginSuccess(data.user, profile.plan);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        alert("Acesso tático criado com sucesso! Faça o login para iniciar.");
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Credenciais inválidas.' : err.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-md"
        style={{ backgroundColor: isDark ? 'rgba(10,10,10,0.95)' : 'rgba(252,248,255,0.95)' }}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-md border shadow-2xl p-8 flex flex-col"
        style={{
          backgroundColor: isDark ? '#101010' : '#FFFFFF',
          borderColor: isDark ? '#262626' : '#D8D5CF',
        }}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-[#525252] hover:text-[#710CCD] transition-colors">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="text-[#842CD5] w-8 h-8" />
          <div>
            <h2 className="font-serif text-2xl font-black uppercase text-[#F2EFE9]">Terminal Auth.</h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
              Protocolo de Segurança EstratAI
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 p-3 text-red-500 font-mono text-[10px] uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: isDark ? '#737373' : '#555555' }}>E-mail Operacional</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 font-sans text-sm outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
                  color: isDark ? '#F2EFE9' : '#1a1a1a',
                  border: `1px solid ${isDark ? '#262626' : '#C8C5BF'}`,
                  WebkitBoxShadow: `0 0 0 1000px ${isDark ? '#0A0A0A' : '#FFFFFF'} inset`,
                  WebkitTextFillColor: isDark ? '#F2EFE9' : '#1a1a1a',
                }}
                placeholder="c-level@empresa.com"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: isDark ? '#737373' : '#555555' }}>Chave de Acesso</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 font-sans text-sm outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
                  color: isDark ? '#F2EFE9' : '#1a1a1a',
                  border: `1px solid ${isDark ? '#262626' : '#C8C5BF'}`,
                  WebkitBoxShadow: `0 0 0 1000px ${isDark ? '#0A0A0A' : '#FFFFFF'} inset`,
                  WebkitTextFillColor: isDark ? '#F2EFE9' : '#1a1a1a',
                }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#842CD5] text-[#0A0A0A] px-6 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-[#710CCD] transition-colors flex justify-center items-center gap-3 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            {isLogin ? 'Iniciar Sessão' : 'Gerar Credencial'}
          </button>
        </form>

        <div className="mt-6 pt-6 text-center" style={{ borderTop: `1px solid ${isDark ? '#262626' : '#C8C5BF'}` }}>
          <p className="font-mono text-[10px] text-[#737373] uppercase tracking-widest">
            {isLogin ? 'Não possui acesso?' : 'Já possui credencial?'}
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="ml-2 text-[#842CD5] hover:text-[#710CCD] font-bold transition-colors"
            >
              {isLogin ? 'Solicitar Abertura' : 'Retornar ao Login'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}