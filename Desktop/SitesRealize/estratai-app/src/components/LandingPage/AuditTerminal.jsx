import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight, CheckCircle2, ShieldAlert, Zap, Loader2 } from 'lucide-react';
import { fadeUp, formVariants } from '../../utils/animations';

// Função auxiliar obrigatória para o Netlify Forms entender os dados
const encode = (data) => {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
};

export default function AuditTerminal() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    nome: '', 
    email: '', 
    cargo: '', 
    cargoOutro: '', 
    empresa: '', 
    setor: '', 
    setorOutro: '',
    tamanho: '', 
    projetos: '', 
    dor: '' 
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Array com exemplos de dores para alternar no placeholder
  const exemplosFalhas = [
    "Ex: Prazos estourados...",
    "Ex: Falta de alinhamento na equipe...",
    "Ex: Orçamento excedido...",
    "Ex: Refação constante de tarefas...",
    "Ex: Falta de visibilidade do progresso...",
    "Ex: Baixa produtividade..."
  ];

  // Efeito para trocar o placeholder a cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % exemplosFalhas.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const nextStep = () => { if (step < 3) setStep(step + 1); };
  const prevStep = () => { if (step > 1) setStep(step - 1); };
  
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    setIsSubmitting(true);
    
    // Consolida as op��es "outros" antes de enviar
    const finalData = {
      ...formData,
      cargo: formData.cargo === 'other' ? formData.cargoOutro : formData.cargo,
      setor: formData.setor === 'outros' ? formData.setorOutro : formData.setor
    };

    // Remove as chaves "cargoOutro" e "setorOutro" para não sujar o form da Netlify
    delete finalData.cargoOutro;
    delete finalData.setorOutro;

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({
          "form-name": "auditoria", // Esse nome tem que bater com o form HTML escondido
          ...finalData
        })
      });

      if (response.ok) {
        setStep(4); 
      } else {
        alert("Ocorreu um erro ao enviar os dados. Tente novamente.");
      }
    } catch (error) {
      alert("Erro de conex�o ao enviar formul�rio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = 
    formData.nome && 
    formData.email && 
    formData.empresa && 
    (formData.setor === 'outros' ? formData.setorOutro : formData.setor) && 
    (formData.cargo === 'other' ? formData.cargoOutro : formData.cargo);

  return (
    <>
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #101010 inset !important;
            -webkit-text-fill-color: #F2EFE9 !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <section id="motor-auditoria" className="py-24 md:py-40 px-6 relative bg-transparent">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-18">
          
          <div className="lg:col-span-5 space-y-12">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className="font-serif text-2xl md:text-5xl font-black leading-tight uppercase mb-7 text-[#F2EFE9]">Diagnóstico <br/> Determinístico.</h2>
              <p className="text-[#A3A3A3] text-2xl leading-relaxed mb-8">Otimize suas decisões com nossa anáacheilise automatizada. Defina os parâmetros ao lado para visualizar uma amostra.</p>
              
              <div className="border border-[#262626] p-6 bg-[#101010]/90 backdrop-blur-md">
                <p className="font-nunito text-xs uppercase tracking-widest text-[#737373] mb-4">O que voc� vai receber:</p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-[#842CD5] shrink-0" /><span className="text-[#F2EFE9] text-xl">Plano Starter</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-[#842CD5] shrink-0" /><span className="text-[#F2EFE9] text-xl">Acesso à nossa IA de análise de projetos</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-[#842CD5] shrink-0" /><span className="text-[#F2EFE9] text-xl">Plano de Ação Corretiva em até 7 dias</span></li>
                </ul>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-7">
            <div className="border border-[#262626] bg-[#101010] min-h-[600px] relative overflow-hidden flex flex-col shadow-2xl">
              <div className="border-b border-[#262626] p-4 flex justify-between items-center bg-[#0A0A0A]">
                <div className="flex gap-2"><div className="w-3 h-3 bg-[#262626]" /><div className="w-3 h-3 bg-[#262626]" /><div className="w-3 h-3 bg-[#842CD5]" /></div>
                <span className="font-nunito text-xs uppercase tracking-widest text-[#737373]">Terminal // Passo 0{step}</span>
              </div>
              
              <div className="p-8 md:p-12 flex-1 relative">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="step1" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                        <div className="pb-8">
                          <h3 className="font-sans text-2xl font-bold mb-1 uppercase text-[#F2EFE9]">
                            Credenciais do Operador e Organização
                          </h3>
                          <p className="text-[#737373] font-nunito text-xs uppercase tracking-widest">
                            Coloque seus dados para iniciar o diagnóstico
                          </p>
                        </div>                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group"><label className="block font-nunito text-xs text-[#737373] uppercase mb-2 group-focus-within:text-[#842CD5]"></label><input type="text" name="nome" value={formData.nome} onChange={handleChange} className="w-full bg-transparent border-b border-[#262626] py-3 text-2xl text-[#F2EFE9] focus:border-[#842CD5] outline-none" placeholder="Seu nome" /></div>
                        <div className="group"><label className="block font-nunito text-xs text-[#737373] uppercase mb-2 group-focus-within:text-[#842CD5]"></label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-transparent border-b border-[#262626] py-3 text-2xl text-[#F2EFE9] focus:border-[#842CD5] outline-none" placeholder="nome@empresa.com.br" /></div>
                        <div className="group"><label className="block font-nunito text-xs text-[#737373] uppercase mb-2 group-focus-within:text-[#842CD5]">Nome da Empresa</label><input type="text" name="empresa" value={formData.empresa} onChange={handleChange} className="w-full bg-transparent border-b border-[#262626] py-3 text-2xl text-[#F2EFE9] focus:border-[#842CD5] outline-none" placeholder="Ex: Tech Solutions" /></div>
                        
                        <div className="group">
                          <label className="block font-nunito text-xs text-[#737373] uppercase mb-2 group-focus-within:text-[#842CD5]">Setor de Atuação</label>
                          <div className="relative">
                            <select name="setor" value={formData.setor} onChange={handleChange} className="w-full bg-transparent border-b border-[#262626] py-3 text-2xl text-[#F2EFE9] focus:border-[#842CD5] outline-none appearance-none">
                              <option value="" className="bg-[#101010]">Selecione o setor</option>
                              <option value="Tecnologia / SaaS" className="bg-[#101010]">Tecnologia / SaaS</option>
                              <option value="Finan�as / Fintech" className="bg-[#101010]">Finanças / Fintech</option>
                              <option value="Sa�de / HealthTech" className="bg-[#101010]">Saúde / HealthTech</option>
                              <option value="Varejo / E-commerce" className="bg-[#101010]">Varejo / E-commerce</option>
                              <option value="Ind�stria" className="bg-[#101010]">Indústria</option>
                              <option value="outros" className="bg-[#101010]">Outros</option>
                            </select>
                            <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#525252] rotate-90" />
                          </div>
                          <AnimatePresence>
                            {formData.setor === 'outros' && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <label className="block font-nunito text-xs text-[#737373] uppercase mb-2 pt-4 group-focus-within:text-[#842CD5]">Qual o seu setor?</label>
                                <input type="text" name="setorOutro" value={formData.setorOutro} onChange={handleChange} className="w-full bg-transparent border-b border-[#262626] py-3 text-2xl text-[#F2EFE9] focus:border-[#842CD5] outline-none" placeholder="Digite o setor..." />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="group">
                        <label className="block font-nunito text-xs text-[#737373] uppercase mb-2 group-focus-within:text-[#842CD5]">Nível de Responsabilidade</label>
                        <div className="relative">
                          <select name="cargo" value={formData.cargo} onChange={handleChange} className="w-full bg-transparent border-b border-[#262626] py-3 text-2xl text-[#F2EFE9] focus:border-[#842CD5] outline-none appearance-none">
                            <option value="" className="bg-[#101010]">Selecione sua posição</option>
                            <option value="C-Level (CEO, CTO)" className="bg-[#101010]">C-Level (CEO, CTO)</option>
                            <option value="Gestor / Head" className="bg-[#101010]">Gestor / Head</option>
                            <option value="Especialista / Tech Lead" className="bg-[#101010]">Especialista / Tech Lead</option>
                            <option value="other" className="bg-[#101010]">Outro:</option>
                          </select>
                          <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#525252] rotate-90" />
                        </div>
                        <AnimatePresence>
                          {formData.cargo === 'other' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                              <label className="block font-nunito text-xs text-[#737373] uppercase mb-2 pt-4 group-focus-within:text-[#842CD5]">Qual o seu cargo?</label>
                              <input type="text" name="cargoOutro" value={formData.cargoOutro} onChange={handleChange} className="w-full bg-transparent border-b border-[#262626] py-3 text-2xl text-[#F2EFE9] focus:border-[#842CD5] outline-none" placeholder="Digite seu cargo..." />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <button onClick={nextStep} disabled={!isStep1Valid} className="w-full border border-[#262626] bg-[#101010] text-[#F2EFE9] font-nunito text-xs uppercase tracking-widest font-bold py-4 hover:bg-[#842CD5] hover:border-[#842CD5] hover:text-[#0A0A0A] disabled:opacity-30 transition-all flex justify-center items-center gap-3">
                        Prosseguir <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="step2" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-10">
                      <div><h3 className="font-sans text-2xl font-bold mb-2 uppercase text-[#F2EFE9]">Parâmetros Operacionais</h3><p className="text-[#737373] font-nunito text-xs uppercase tracking-widest">Métricas do Projeto</p></div>
                      <div className="space-y-8">
                        <div><label className="block font-nunito text-xs text-[#737373] uppercase mb-4">Projetos em Andamento</label><div className="grid grid-cols-3 gap-3">{['< 3', '4 a 10', '> 10'].map(opt => (<label key={opt} className={`border p-3 cursor-pointer text-center transition-colors ${formData.projetos === opt ? 'border-[#842CD5] bg-[#842CD5]/10 text-[#842CD5]' : 'border-[#262626] text-[#737373] hover:border-[#525252]'}`}><input type="radio" name="projetos" value={opt} onChange={handleChange} className="hidden" /><span className="font-nunito text-xs font-bold">{opt}</span></label>))}</div></div>
                        <div><label className="block font-nunito text-xs text-[#737373] uppercase mb-4">Tamanho da Equipe</label><div className="grid grid-cols-3 gap-3">{['< 10', '11 a 50', '> 50'].map(opt => (<label key={opt} className={`border p-3 cursor-pointer text-center transition-colors ${formData.tamanho === opt ? 'border-[#842CD5] bg-[#842CD5]/10 text-[#842CD5]' : 'border-[#262626] text-[#737373] hover:border-[#525252]'}`}><input type="radio" name="tamanho" value={opt} onChange={handleChange} className="hidden" /><span className="font-nunito text-xs font-bold">{opt}</span></label>))}</div></div>
                        <div className="group">
                          <label className="block font-nunito text-xs text-[#737373] uppercase mb-2 group-focus-within:text-[#842CD5]">Maior falha na execu��o?</label>
                          <input 
                            type="text" 
                            name="foco" 
                            value={formData.foco} 
                            onChange={handleChange} 
                            className="w-full bg-transparent border-b border-[#262626] py-3 text-2xl text-[#F2EFE9] focus:border-[#842CD5] outline-none transition-all duration-300 placeholder:transition-opacity" 
                            placeholder={exemplosFalhas[placeholderIndex]} 
                          />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={prevStep} className="px-6 border border-[#262626] text-[#737373] font-nunito text-xs uppercase font-bold hover:bg-[#262626] transition-colors">Voltar</button>
                        <button onClick={nextStep} disabled={!formData.projetos || !formData.tamanho || !formData.foco} className="flex-1 border border-[#262626] bg-[#101010] text-[#F2EFE9] font-nunito text-xs uppercase font-bold py-4 hover:bg-[#842CD5] hover:border-[#842CD5] hover:text-[#0A0A0A] disabled:opacity-30 transition-all flex justify-center items-center gap-3">Avan�ar <ArrowRight className="w-4 h-4" /></button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div key="step3" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-10">
                      <div><h3 className="font-sans text-2xl font-bold mb-2 uppercase text-[#F2EFE9]">Iniciação do Sistema</h3><p className="text-[#737373] font-nunito text-xs uppercase tracking-widest">Revisão de Dados</p></div>
                      <div className="bg-[#0A0A0A] border border-[#262626] p-6 space-y-4 font-nunito text-xs">
                        <div className="flex justify-between border-b border-[#262626] pb-3"><span className="text-[#737373]">Operador:</span><span className="text-[#F2EFE9]">{formData.nome}</span></div>
                        <div className="flex justify-between border-b border-[#262626] pb-3">
                          <span className="text-[#737373]">Empresa:</span>
                          <span className="text-[#F2EFE9]">{formData.empresa} ({formData.setor === 'outros' ? formData.setorOutro : formData.setor})</span>
                        </div>
                        <div className="flex justify-between border-b border-[#262626] pb-3"><span className="text-[#737373]">Carga:</span><span className="text-[#F2EFE9]">{formData.projetos} projetos</span></div>
                        <div className="flex justify-between"><span className="text-[#737373]">Foco:</span><span className="text-[#F2EFE9] text-right ml-4">{formData.foco}</span></div>
                      </div>
                      <div className="p-4 border border-[#842CD5]/30 bg-[#842CD5]/10 flex gap-4"><ShieldAlert className="w-5 h-5 text-[#842CD5] shrink-0" /><p className="text-xs text-[#A3A3A3] font-nunito">Aviso: Ao continuar você concorda em nos disponibilizar seus projetos para aperfeiçoamento de nosso sistema</p></div>
                      <div className="flex gap-4">
                        <button onClick={prevStep} disabled={isSubmitting} className="px-6 border border-[#262626] text-[#737373] font-nunito text-xs uppercase font-bold hover:bg-[#262626] transition-colors disabled:opacity-50">Ajustar</button>
                        <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 border border-[#842CD5] bg-[#842CD5] text-[#0A0A0A] font-nunito text-xs uppercase font-bold py-4 hover:bg-transparent hover:text-[#842CD5] transition-all flex justify-center items-center gap-3 disabled:opacity-50">
                          {isSubmitting ? (
                            <>Processando... <Loader2 className="w-4 h-4 animate-spin" /></>
                          ) : (
                            <>Executar Auditoria <Zap className="w-4 h-4" /></>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div key="step4" variants={formVariants} initial="hidden" animate="visible" className="flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="w-16 h-16 bg-[#842CD5] flex items-center justify-center mb-6"><CheckCircle2 className="w-8 h-8 text-[#0A0A0A]" /></motion.div>
                      <h3 className="font-serif text-2xl font-bold mb-4 uppercase text-[#F2EFE9]">Processamento</h3>
                      <p className="text-[#A3A3A3] max-w-sm mx-auto leading-relaxed mb-8">Seus dados foram processados e estaremos entrando em contato nas próximas horas, obrigado pela escolha de nossa plataforma!</p>
                      <button onClick={() => { setStep(1); setFormData({ nome: '', email: '', empresa: '', setor: '', setorOutro: '', cargo: '', cargoOutro: '', tamanho: '', projetos: '', foco: '' })}} className="text-[#737373] font-nunito text-xs uppercase tracking-widest hover:text-[#842CD5] underline underline-offset-4 transition-colors">Submeter nova análise</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}