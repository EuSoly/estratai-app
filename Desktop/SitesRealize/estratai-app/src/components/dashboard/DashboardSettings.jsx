import React, { useState, useEffect } from 'react';
import { User, CreditCard, Palette, Bell, Link2, Shield, Sun, Moon, Key, Check, Globe } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';
import { getPlanColor, PLAN_COLORS, PLAN_LEVELS } from '../../constants/plans';
import { useUserPreferences } from '../../hooks/useUserPreferences';

// ─── Seções disponíveis ───────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'conta',        label: 'Conta',        Icon: User },
  { id: 'plano',        label: 'Plano & Cobrança', Icon: CreditCard },
  { id: 'aparencia',    label: 'Aparência',    Icon: Palette },
  { id: 'notificacoes', label: 'Notificações', Icon: Bell },
  { id: 'integracoes',  label: 'Integrações',  Icon: Link2 },
  { id: 'seguranca',    label: 'Segurança',    Icon: Shield },
];

// ─── Sub-componentes de layout ────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-4 bg-[#842CD5]" />
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#737373]">{children}</span>
    </div>
  );
}

function SettingsCard({ children, className = '' }) {
  return (
    <div className={`border border-[#262626] bg-[#101010] ${className}`}
      style={{ padding: 'var(--ui-card-p)' }}>
      {children}
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="font-mono text-[10px] uppercase tracking-widest text-[#737373] block mb-2">{children}</label>;
}

function InputField({ value, onChange, disabled, placeholder, type = 'text' }) {
  const { isDark } = useTheme();
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full border border-[#262626] focus:border-[#842CD5] font-sans text-sm outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
        color: isDark ? '#F2EFE9' : '#1a1a1a',
        padding: 'var(--ui-input-p)'
      }}
    />
  );
}

function Toggle({ enabled, onToggle, label, description }) {
  const { isDark } = useTheme();
  return (
    <div className="flex items-center justify-between py-4 border-b border-[#262626] last:border-0">
      <div>
        <p className="font-mono text-xs text-[#F2EFE9] uppercase tracking-widest">{label}</p>
        {description && <p className="font-sans text-xs text-[#525252] mt-0.5">{description}</p>}
      </div>
      <button
        onClick={onToggle}
        className="relative w-10 h-5 transition-colors shrink-0"
        style={{ backgroundColor: enabled ? '#842CD5' : (isDark ? '#262626' : '#E4DAF5') }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 transition-all"
          style={{ left: enabled ? '22px' : '2px', backgroundColor: isDark ? '#F2EFE9' : '#FFFFFF' }}
        />
      </button>
    </div>
  );
}

function SaveButton({ onClick, saving, label = 'Salvar Alterações' }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 bg-[#842CD5] text-[#0A0A0A] px-6 py-3 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-[#710CCD] transition-colors disabled:opacity-50"
    >
      {saving ? 'Salvando...' : <><Check size={12} /> {label}</>}
    </button>
  );
}

function MockBadge({ children }) {
  return (
    <span className="font-mono text-[9px] uppercase tracking-widest text-[#737373] border border-[#262626] px-2 py-0.5 bg-[#0A0A0A]">
      Em breve
    </span>
  );
}

// ─── Seção: Conta ─────────────────────────────────────────────────────────────
function SecaoConta({ user }) {
  const [name, setName]           = useState('');
  const [photoUrl, setPhotoUrl]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name, photo_url').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.full_name) setName(data.full_name);
        if (data?.photo_url) setPhotoUrl(data.photo_url);
      });
  }, [user]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `${user.id}_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filename, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filename);

      const url = data?.publicUrl;
      if (url) {
        setPhotoUrl(url);
        await supabase.from('profiles').update({ photo_url: url }).eq('id', user.id);
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <SectionLabel>Informações da Conta</SectionLabel>

      <SettingsCard>
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[#262626]">
          <div className="w-16 h-16 border border-[#262626] bg-[#0A0A0A] flex items-center justify-center overflow-hidden flex-shrink-0">
            {photoUrl ? (
              <img src={photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-[#525252]" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-mono text-xs text-[#F2EFE9] uppercase tracking-widest mb-1">Foto de Perfil</p>
            <p className="font-sans text-xs text-[#525252] mb-2">
              {photoUrl ? 'Foto carregada com sucesso' : 'Nenhuma foto ainda'}
            </p>
            <label className="font-mono text-[10px] uppercase tracking-widest text-[#737373] hover:text-[#842CD5] transition-colors cursor-pointer flex items-center gap-1">
              {uploading ? 'Enviando...' : 'Alterar foto'}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <FieldLabel>Nome completo</FieldLabel>
            <InputField
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome..."
            />
          </div>
          <div>
            <FieldLabel>E-mail</FieldLabel>
            <InputField value={user?.email || '—'} disabled />
            <p className="font-mono text-[9px] uppercase text-[#525252] mt-1">Alterar e-mail requer verificação.</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[#262626] flex justify-end">
          <SaveButton onClick={handleSave} saving={saving} />
        </div>
      </SettingsCard>

      <SectionLabel>Zona de Perigo</SectionLabel>
      <SettingsCard className="border-red-900/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-[#F2EFE9] uppercase tracking-widest mb-1">Excluir Conta</p>
            <p className="font-sans text-xs text-[#525252]">Esta ação é irreversível. Todos os projetos e dados serão removidos.</p>
          </div>
          <button className="font-mono text-[10px] uppercase tracking-widest text-red-500 border border-red-500/30 px-4 py-2.5 hover:bg-red-500/10 transition-colors shrink-0 ml-4">
            Excluir Conta
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}

// ─── Seção: Plano & Cobrança ──────────────────────────────────────────────────
function SecaoPlano({ userPlan }) {
  const c = getPlanColor(userPlan);
  const currentLevel = PLAN_LEVELS[userPlan] || 1;

  const planFeatures = {
    Starter:    ['1 projeto de teste', 'Exportação em PDF', 'Suporte via E-mail', 'Tempo de resposta de até 7 dias'],
    Business:   ['Maior limite de Projetos', 'Modelos de análise customizados', 'Mais integrações', 'Dashboard de Projetos', 'Atendimento prioritário'],
    Enterprise: ['Múltiplas Unidades de Negócio', 'Insights personalizados', 'SLA de 99.9%', 'Consultoria Trimestral', 'Privacidade e Segurança'],
  };

  return (
    <div className="space-y-6">
      <SectionLabel>Plano Atual</SectionLabel>

      {/* Card do plano atual */}
      <SettingsCard>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mb-1">Plano ativo</p>
            <p className="font-serif text-4xl font-black uppercase" style={{ color: c.hex }}>{userPlan}</p>
          </div>
          <span
            className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 font-bold"
            style={{ color: c.hex, backgroundColor: c.bg, border: `1px solid ${c.border}` }}
          >
            Ativo
          </span>
        </div>

        <div className="mt-6 pt-6 border-t border-[#262626]">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#737373] mb-3">Recursos incluídos</p>
          <ul className="space-y-2">
            {(planFeatures[userPlan] || []).map((f, i) => (
              <li key={i} className="flex items-center gap-2 font-sans text-sm text-[#A3A3A3]">
                <Check size={12} style={{ color: c.hex }} /> {f}
              </li>
            ))}
          </ul>
        </div>
      </SettingsCard>

      {/* Upgrade */}
      {currentLevel < 3 && (
        <>
          <SectionLabel>Fazer Upgrade</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(PLAN_COLORS)
              .filter(([plan]) => (PLAN_LEVELS[plan] || 1) > currentLevel)
              .map(([plan, colors]) => (
                <SettingsCard key={plan}>
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: colors.hex }}>
                    {plan}
                  </p>
                  <p className="font-sans text-xs text-[#737373] mb-4">
                    Desbloqueie funcionalidades avançadas do plano {plan}.
                  </p>
                  <button
                    className="w-full py-3 font-mono text-[10px] uppercase tracking-widest font-bold transition-colors"
                    style={{ backgroundColor: colors.bg, color: colors.hex, border: `1px solid ${colors.border}` }}
                  >
                    Falar com Comercial
                  </button>
                </SettingsCard>
              ))}
          </div>
        </>
      )}

      <SectionLabel>Histórico de Cobrança</SectionLabel>
      <SettingsCard>
        <div className="flex flex-col items-center py-8 text-center">
          <CreditCard size={28} className="text-[#525252] mb-3" />
          <p className="font-mono text-xs uppercase tracking-widest text-[#525252]">Nenhuma fatura disponível.</p>
          <p className="font-sans text-xs text-[#525252] mt-1">O histórico de cobranças aparecerá aqui.</p>
        </div>
      </SettingsCard>
    </div>
  );
}

// ─── Seção: Aparência ─────────────────────────────────────────────────────────
function SecaoAparencia() {
  const { theme, toggleTheme } = useTheme();
  const { prefs, updatePref } = useUserPreferences();

  return (
    <div className="space-y-6">
      <SectionLabel>Tema</SectionLabel>
      <SettingsCard>
        <div className="flex gap-3">
          {[
            { id: 'dark',  Icon: Moon,  label: 'Escuro' },
            { id: 'light', Icon: Sun,   label: 'Claro' },
          ].map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={(e) => id !== theme && toggleTheme(e)}
              className="flex-1 flex flex-col items-center gap-3 py-6 border transition-all"
              style={theme === id
                ? { borderColor: '#842CD5', backgroundColor: 'rgba(132,44,213,0.05)' }
                : { borderColor: '#262626' }
              }
            >
              <Icon size={22} style={{ color: theme === id ? '#842CD5' : '#525252' }} />
              <span
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: theme === id ? '#F2EFE9' : '#525252' }}
              >
                {label}
              </span>
              {theme === id && (
                <span className="font-mono text-[9px] uppercase text-[#842CD5]">Ativo</span>
              )}
            </button>
          ))}
        </div>
        <p className="font-mono text-[9px] uppercase text-[#525252] mt-4">
          O modo claro está em desenvolvimento — alguns componentes ainda não suportam a troca completa.
        </p>
      </SettingsCard>

      <SectionLabel>Densidade da Interface</SectionLabel>
      <SettingsCard>
        <div className="flex gap-3">
          {[
            { id: 'spacious', label: 'Espaçada', desc: 'Confortável, muito espaço' },
            { id: 'normal',   label: 'Normal',   desc: 'Equilibrado' },
            { id: 'compact',  label: 'Compacta', desc: 'Compacto, mais informações' },
          ].map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => updatePref('density', id)}
              className="flex-1 flex flex-col items-center gap-2 py-4 px-3 border transition-all text-center"
              style={prefs.density === id
                ? { borderColor: '#842CD5', backgroundColor: 'rgba(132,44,213,0.05)' }
                : { borderColor: '#262626' }
              }
            >
              <span
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: prefs.density === id ? '#842CD5' : '#F2EFE9' }}
              >
                {label}
              </span>
              <span
                className="font-sans text-[11px]"
                style={{ color: prefs.density === id ? '#842CD5' : '#525252' }}
              >
                {desc}
              </span>
              {prefs.density === id && (
                <span className="font-mono text-[8px] uppercase text-[#842CD5] mt-1">✓ Ativo</span>
              )}
            </button>
          ))}
        </div>
        <p className="font-mono text-[9px] uppercase text-[#525252] mt-4">
          Muda o espaçamento e tamanho dos elementos em toda a interface.
        </p>
      </SettingsCard>

      <SectionLabel>Animações</SectionLabel>
      <SettingsCard>
        <Toggle
          enabled={prefs.animationsEnabled}
          onToggle={() => updatePref('animationsEnabled', !prefs.animationsEnabled)}
          label="Ativar Animações"
          description="Desative para melhor performance em conexões lentas."
        />
      </SettingsCard>

      <SectionLabel>Idioma</SectionLabel>
      <SettingsCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe size={16} className="text-[#525252]" />
            <div>
              <p className="font-mono text-xs text-[#F2EFE9] uppercase tracking-widest">Português (Brasil)</p>
              <p className="font-sans text-xs text-[#525252] mt-0.5">Idioma atual do sistema.</p>
            </div>
          </div>
          <MockBadge />
        </div>
      </SettingsCard>
    </div>
  );
}

// ─── Seção: Notificações ──────────────────────────────────────────────────────
function SecaoNotificacoes() {
  const { prefs, updatePref } = useUserPreferences();

  return (
    <div className="space-y-6">
      <SectionLabel>Notificações por E-mail</SectionLabel>
      <SettingsCard>
        <Toggle
          enabled={prefs.emailNotifications}
          onToggle={() => updatePref('emailNotifications', !prefs.emailNotifications)}
          label="Notificações por E-mail"
          description="Receba notificações importantes por e-mail."
        />
        <Toggle
          enabled={prefs.weeklyDigest}
          onToggle={() => updatePref('weeklyDigest', !prefs.weeklyDigest)}
          label="Resumo Semanal"
          description="Resumo semanal de atividades e descobertas."
        />
      </SettingsCard>

      <SectionLabel>Notificações no App</SectionLabel>
      <SettingsCard>
        <Toggle
          enabled={prefs.pushNotifications}
          onToggle={() => updatePref('pushNotifications', !prefs.pushNotifications)}
          label="Notificações Push"
          description="Alertas em tempo real sobre análises e atualizações."
        />
      </SettingsCard>

      <div className="flex justify-end gap-3">
        <p className="font-mono text-[9px] uppercase text-[#737373] self-center">
          Preferências salvas automaticamente
        </p>
      </div>
    </div>
  );
}

// ─── Seção: Integrações ───────────────────────────────────────────────────────
function SecaoIntegracoes() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('webhook_url').eq('id', user.id).single()
        .then(({ data }) => { if (data?.webhook_url) setWebhookUrl(data.webhook_url); });
    });
  }, []);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ webhook_url: webhookUrl }).eq('id', user.id);
    setSaving(false);
  };

  const integracoes = [
    { name: 'Slack',     desc: 'Receba notificações de relatórios diretamente no Slack.' },
    { name: 'Notion',    desc: 'Exporte relatórios como páginas no seu workspace.' },
    { name: 'HubSpot',   desc: 'Sincronize projetos com oportunidades do CRM.' },
    { name: 'Zapier',    desc: 'Automatize fluxos com qualquer app via Zapier.' },
  ];

  return (
    <div className="space-y-6">
      <SectionLabel>Webhook n8n</SectionLabel>
      <SettingsCard>
        <p className="font-sans text-sm text-[#737373] mb-5">
          URL do webhook n8n que receberá os dados do projeto para disparar análises com IA.
        </p>
        <FieldLabel>URL do Webhook</FieldLabel>
        <InputField
          value={webhookUrl}
          onChange={e => setWebhookUrl(e.target.value)}
          placeholder="https://seu-n8n.com/webhook/..."
        />
        <div className="mt-4 flex items-center justify-between">
          <p className="font-mono text-[9px] uppercase text-[#525252]">
            Esta URL é usada globalmente por todos os projetos.
          </p>
          <SaveButton onClick={handleSave} saving={saving} label="Salvar URL" />
        </div>
      </SettingsCard>

      <SectionLabel>Outras Integrações</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {integracoes.map(({ name, desc }) => (
          <SettingsCard key={name}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-[#F2EFE9] uppercase tracking-widest mb-1">{name}</p>
                <p className="font-sans text-xs text-[#525252]">{desc}</p>
              </div>
              <MockBadge />
            </div>
          </SettingsCard>
        ))}
      </div>
    </div>
  );
}

// ─── Seção: Segurança ─────────────────────────────────────────────────────────
function SecaoSeguranca() {
  const [saving, setSaving] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }, 800);
  };

  const sessions = [
    { device: 'Chrome — Windows 11', location: 'Curitiba, BR', active: true,  last: 'Agora' },
    { device: 'Safari — iPhone 15',  location: 'São Paulo, BR', active: false, last: 'Há 2 dias' },
  ];

  return (
    <div className="space-y-6">
      <SectionLabel>Alterar Senha</SectionLabel>
      <SettingsCard>
        <div className="space-y-4">
          <div>
            <FieldLabel>Senha atual</FieldLabel>
            <InputField type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Nova senha</FieldLabel>
              <InputField type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <FieldLabel>Confirmar nova senha</FieldLabel>
              <InputField type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-[#262626] flex justify-end">
          <SaveButton onClick={handleSave} saving={saving} label="Atualizar Senha" />
        </div>
      </SettingsCard>

      <SectionLabel>Autenticação em Dois Fatores</SectionLabel>
      <SettingsCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key size={16} className="text-[#525252]" />
            <div>
              <p className="font-mono text-xs text-[#F2EFE9] uppercase tracking-widest">2FA via Authenticator</p>
              <p className="font-sans text-xs text-[#525252] mt-0.5">Adicione uma camada extra de segurança à sua conta.</p>
            </div>
          </div>
          <MockBadge />
        </div>
      </SettingsCard>

      <SectionLabel>Sessões Ativas</SectionLabel>
      <SettingsCard>
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-[#262626] last:border-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.active ? '#10b981' : '#525252' }}
                />
                <div>
                  <p className="font-mono text-[10px] text-[#F2EFE9] uppercase tracking-widest">{s.device}</p>
                  <p className="font-sans text-xs text-[#525252]">{s.location} · {s.last}</p>
                </div>
              </div>
              {!s.active && (
                <button className="font-mono text-[9px] uppercase text-red-500/70 hover:text-red-500 transition-colors">
                  Revogar
                </button>
              )}
              {s.active && (
                <span className="font-mono text-[9px] uppercase text-[#10b981]">Esta sessão</span>
              )}
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DashboardSettings({ userPlan = 'Starter' }) {
  const [activeSection, setActiveSection] = useState('conta');
  const [authUser, setAuthUser]           = useState(null);
  const { isDark } = useTheme();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case 'conta':        return <SecaoConta user={authUser} />;
      case 'plano':        return <SecaoPlano userPlan={userPlan} />;
      case 'aparencia':    return <SecaoAparencia />;
      case 'notificacoes': return <SecaoNotificacoes />;
      case 'integracoes':  return <SecaoIntegracoes />;
      case 'seguranca':    return <SecaoSeguranca />;
      default:             return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-black uppercase text-[#F2EFE9] mb-1">Configurações.</h1>
        <p className="font-mono text-xs uppercase tracking-widest text-[#737373]">Gerencie sua conta e preferências do sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-start">

        {/* Navegação lateral */}
        <nav className="border border-[#262626] bg-[#050505] p-2 lg:sticky lg:top-6">
          {SECTIONS.map(({ id, label, Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className="w-full flex items-center gap-3 px-4 py-3 font-mono text-[10px] uppercase tracking-widest transition-all text-left relative"
                style={isActive
                  ? { color: isDark ? '#F2EFE9' : '#1a1a1a', backgroundColor: isDark ? '#101010' : '#FFFFFF' }
                  : { color: '#525252' }
                }
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#842CD5]" />
                )}
                <Icon size={14} style={{ color: isActive ? '#842CD5' : '#525252' }} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Conteúdo */}
        <div className="min-w-0">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
