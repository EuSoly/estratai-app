import React from 'react';
import { Mail, Globe, ExternalLink } from 'lucide-react';

const LINKS = {
  produto: [
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Preços',        href: '#precos' },
    { label: 'Auditoria IA',  href: '#motor-auditoria' },
    { label: 'Matriz de Agentes', href: '#' },
  ],
  legal: [
    { label: 'Termos de Uso',       href: '#' },
    { label: 'Política de Privacidade', href: '#' },
    { label: 'Política de Cookies', href: '#' },
    { label: 'LGPD',                href: '#' },
  ],
  contato: [
    { label: 'contato@estratai.com.br', href: 'mailto:contato@estratai.com.br' },
    { label: 'Falar com Comercial',     href: '#' },
    { label: 'Suporte Téctico',          href: '#' },
  ],
};

const COL_LABEL = 'font-nunito text-[10px] uppercase tracking-[0.3em] text-[#842CD5] mb-5 block font-bold';
const LINK_CLS  = 'font-nunito text-[10px] uppercase tracking-widest text-[#525252] hover:text-[#710CCD] transition-colors block py-1';

export default function Footer() {
  return (
    <footer className="border-t border-[#262626] bg-[#050505] relative z-10">

      {/* Corpo principal */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">

          {/* Brand */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-[#842CD5]" />
              <span className="font-serif font-black text-2xl tracking-tighter uppercase text-[#F2EFE9]">
                Estrat-AI.
              </span>
            </div>
            <p className="font-sans text-xl text-[#525252] leading-relaxed max-w-xs">
              Plataforma de inteligência estratégica que analisa, audita e otimiza a estratégia organizacional com suporte algorítmico.
            </p>
            {/* Redes sociais */}
            <div className="flex items-center gap-3 pt-2">
              {[
                { Icon: Globe,        href: '#',    label: 'LinkedIn'  },
                { Icon: ExternalLink, href: '#',    label: 'Instagram' },
                { Icon: Mail,         href: 'mailto:contato@estratai.com.br', label: 'E-mail' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 border border-[#262626] flex items-center justify-center text-[#525252] hover:border-[#842CD5] hover:text-[#842CD5] transition-all"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-1" />

          {/* Produto */}
          <div className="lg:col-span-2">
            <span className={COL_LABEL}>Produto</span>
            <nav className="space-y-0.5">
              {LINKS.produto.map(({ label, href }) => (
                <a key={label} href={href} className={LINK_CLS}>{label}</a>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div className="lg:col-span-3">
            <span className={COL_LABEL}>Legal</span>
            <nav className="space-y-0.5">
              {LINKS.legal.map(({ label, href }) => (
                <a key={label} href={href} className={LINK_CLS}>{label}</a>
              ))}
            </nav>
          </div>

          {/* Contato */}
          <div className="lg:col-span-2">
            <span className={COL_LABEL}>Contato</span>
            <nav className="space-y-0.5">
              {LINKS.contato.map(({ label, href }) => (
                <a key={label} href={href} className={LINK_CLS}>{label}</a>
              ))}
            </nav>
          </div>

        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-[#262626]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-nunito text-[10px] uppercase tracking-widest text-[#525252]">
            © 2026 EstratAI. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="font-nunito text-[10px] uppercase tracking-widest text-[#525252] hover:text-[#842CD5] transition-colors">
              Termos
            </a>
            <a href="#" className="font-nunito text-[10px] uppercase tracking-widest text-[#525252] hover:text-[#842CD5] transition-colors">
              Privacidade
            </a>
            <a href="#" className="font-nunito text-[10px] uppercase tracking-widest text-[#525252] hover:text-[#842CD5] transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>

    </footer>
  );
}
