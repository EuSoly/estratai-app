import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Database, Cpu, FileCheck } from 'lucide-react';
import { fadeUp } from '../../utils/animations';

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRefs = useRef([]);
  const containerRef = useRef(null);

  // L� o scroll APENAS dentro da caixa da direita
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  // D� um peso/f�sica para a linha laranja descer suave
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const steps = [
    {
      id: "01",
      title: "Aquisição de Dados",
      icon: <Database className="w-6 h-6 lg:w-8 lg:h-8 text-[#842CD5]" />,
      desc: "Você importa seus projetos para nossa plataforma e nosso sistema inicia a análise profunda dos dados automaticamente."
    },
    {
      id: "02",
      title: "Auditoria Algorítmica",
      icon: <Cpu className="w-6 h-6 lg:w-8 lg:h-8 text-[#842CD5]" />,
      desc: "Nosso agente de IA cruza os dados do seu projeto com a estratégia da sua empresa, mapeando as próximas etapas do seu ciclo de desenvolvimento."
    },
    {
      id: "03",
      title: "Plano de correção de rota",
      icon: <FileCheck className="w-6 h-6 lg:w-8 lg:h-8 text-[#842CD5]" />,
      desc: "Entregamos um plano de ação completo com as melhores práticas de desenvolvimento, totalmente adaptado ao modelo de análise que você escolheu."
    }
  ];

  // Observador para saber qual cartão está no meio da tela e acender a esquerda
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionRefs.current.indexOf(entry.target);
            if (index !== -1) setActiveStep(index);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px" } // Margem mais segura para telas menores
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="como-funciona" className="py-24 md:py-40 px-6 border-b border-[#262626] bg-transparent">
      {/* Ajuste de gap e grid para evitar que um lado esmague o outro */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20 items-start relative">

        {/* COLUNA DA ESQUERDA: Menu Fixo */}
        <div className="lg:col-span-5 lg:sticky lg:top-32 z-10 pr-0 lg:pr-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black uppercase text-[#F2EFE9] leading-tight mb-8">
              Engenharia de <br/>
              <span className="text-[#842CD5]">Alinhamento.</span>
            </h2>

            <div className="mt-12 hidden lg:block relative pl-2">
              {/* Linha de Fundo do Menu Esquerdo */}
              <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-[#262626]" />
              
              {/* Fluido Laranja do Menu Esquerdo */}
              <motion.div
                className="absolute left-[15px] top-4 w-[1px] bg-[#842CD5] origin-top"
                initial={{ height: "0%" }}
                animate={{ height: `${(activeStep / (steps.length - 1)) * 80}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />

              <div className="space-y-12">
                {steps.map((step, index) => {
                  const isActive = activeStep === index;
                  const isPast = activeStep >= index;
                  return (
                    <button
                      key={step.id}
                      onClick={() => sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                      className="w-full text-left group flex items-center gap-6 relative"
                    >
                      {/* Bolinha do menu */}
                      <div className={`w-4 h-4 rounded-full border-1 bg-[#0A0A0A] transition-colors duration-500 z-10 ${isPast ? 'border-[#842CD5]' : 'border-[#262626]'}`} />
                      
                      <div className="flex flex-col">
                        <span className={`font-nunito text-sm font-bold transition-colors duration-300 ${isActive ? 'text-[#842CD5]' : 'text-[#525252]'}`}>
                          Passo {step.id}
                        </span>
                        <span className={`font-sans text-2xl uppercase font-bold tracking-wide transition-colors duration-300 ${isActive ? 'text-[#F2EFE9]' : 'text-[#525252] group-hover:text-[#A3A3A3]'}`}>
                          {step.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* COLUNA DA DIREITA: Cartões com a LINHA CONECTORA */}
        {/* Colocamos pl-10 (padding left) para garantir que a linha não encoste no texto */}
        <div className="lg:col-span-7 relative pb-24 pl-4 md:pl-16" ref={containerRef}>
          
          {/* A MAGIA CORRIGIDA: A Linha Central Conectora */}
          <div className="absolute left-0 md:left-4 top-12 bottom-12 w-[2px] md:w-[3px] bg-[#262626] z-0">
            {/* O Fluido Laranja - Agora com H-FULL e originY */}
            <motion.div 
              className="absolute top-0 left-0 w-full h-full bg-[#842CD5]"
              style={{ scaleY, originY: 0 }}
            />
          </div>

          <div className="flex flex-col">
            {steps.map((step, index) => {
              const isActive = activeStep >= index;
              
              return (
                <div 
                  key={step.id}
                  ref={(el) => (sectionRefs.current[index] = el)}
                  className="min-h-[60vh] flex flex-col justify-center py-12 relative z-10"
                >
                  <div className="flex items-start gap-6 lg:gap-10">
                    
                    {/* O "NÓ" da Linha (�cone) puxado um pouco para a esquerda para alinhar com a linha */}
                    <div className="shrink-0 flex items-center justify-center relative -ml-[31px] md:-ml-[25px]">
                      <div className={`w-14 h-14 md:w-20 md:h-20 border-2 md:border-[3px] flex items-center justify-center bg-[#0A0A0A] transition-colors duration-500 ease-in-out ${isActive ? 'border-[#842CD5]' : 'border-[#262626]'}`}>
                         <div className={`transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-30 scale-75 grayscale'}`}>
                            {step.icon}
                         </div>
                      </div>
                    </div>

                    {/* O Cart�o em si - Agora com flex-1 garantido para n�o esmagar o texto */}
                    <motion.div
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-50px" }}
                      variants={fadeUp}
                      className={`flex-1 min-w-0 border bg-[#101010]/90 backdrop-blur-md p-6 md:p-10 shadow-2xl transition-colors duration-500 ${activeStep === index ? 'border-[#842CD5]/50' : 'border-[#262626]'}`}
                    >
                      <div className="absolute top-0 right-0 w-2 h-2 bg-[#842CD5]" />
                      <span className="font-nunito text-xl md:text-3xl font-black text-[#262626] mb-2 md:mb-4 block lg:hidden">
                        {step.id}
                      </span>
                      {/* text-wrap balance ajuda a não quebrar palavras estranhas */}
                      <h3 className="font-sans text-xl md:text-2xl font-bold text-[#F2EFE9] mb-4 uppercase text-balance">
                        {step.title}
                      </h3>
                      <p className="text-[#A3A3A3] leading-relaxed text-xl md:text-2xl font-light">
                        {step.desc}
                      </p>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
