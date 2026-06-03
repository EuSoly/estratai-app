import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Code, Zap, Terminal, Eye, HelpCircle, BarChart2, MessageSquare } from 'lucide-react';
import { fadeUp, containerVariants } from '../../utils/animations';

// --- DADOS UNIFICADOS E COORDENADAS AJUSTADAS ---
// Coordenadas refeitas para formar uma rede mais equilibrada (Pent�gono)
const DYNAMIC_CONCEPTS = [
  { id: 1, word: "EXECUÇÃO.", icon: Terminal, x: 15, y: 40 },
  { id: 2, word: "SUBJETIVIDADE.", icon: Eye, x: 50, y: 10 },
  { id: 3, word: "INCERTEZA.", icon: HelpCircle, x: 85, y: 40 }, 
  { id: 4, word: "FALTA DE MÉTRICA", icon: BarChart2, x: 30, y: 85 },
  { id: 5, word: "ACHISMO.", icon: MessageSquare, x: 70, y: 85 }, 
];

const CENTER_NODE = { id: 6, x: 50, y: 50, icon: Zap }; // Centralizado perfeitamente

const GRAPH_CONNECTIONS = [
  [1, 2], [1, 4], [2, 3], [2, 6], [3, 6], [4, 6], [4, 5], [5, 6]
  //  0       1       2       3       4       5       6       7
];

// --- COMPONENTE: �rea de Visualiza��o do "Gr�fico" (Direita) ---
const NodeAuditVisualization = ({ activeIndex, onNodeClick }) => {
  const allNodes = [...DYNAMIC_CONCEPTS, CENTER_NODE];

  const getConnectionsToHighlight = (idx) => {
    if (idx === 0) return [0, 1]; // Execu��o
    if (idx === 1) return [3];    // Subjetividade
    if (idx === 2) return [4];    // Incerteza
    if (idx === 3) return [5];    // Falta de M�tricas
    if (idx === 4) return [7];    // Achismo
    return [];
  };

  const connectionsToHighlight = getConnectionsToHighlight(activeIndex);

  return (
    <div className="relative w-full h-full min-h-[350px] sm:min-h-[400px] md:min-h-[500px] bg-[#101010] border border-[#262626] overflow-hidden shadow-inner flex flex-col">
      <div className="border-b border-[#262626] p-4 flex justify-between items-center bg-[#0A0A0A] shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 bg-[#262626]" />
          <div className="w-2.5 h-2.5 bg-[#262626]" />
          <div className="w-2.5 h-2.5 bg-[#842CD5]" />
        </div>
        <span className="font-nunito text-[10px] uppercase tracking-widest text-[#737373]">
          Audit_Visualize // project_id:alpha_42
        </span>
      </div>

      {/* CAIXA UNIFICADA: Garante que o SVG e o HTML usem exatamente o mesmo espa�o f�sico */}
      <div className="relative flex-1 mt-8 mb-12 mx-8 sm:mx-12">
        
        {/* SVG PROCEDURAL: Linhas desenhadas baseadas em porcentagem de CSS pura */}
        <svg className="absolute inset-0 w-full h-full z-0 overflow-visible">
          {/* M�SCARA SVG: Recorta o espa�o das hitboxes para que as linhas n�o atravessem o centro dos bot�es */}
          <defs>
            <mask id="nodes-mask">
              {/* O fundo branco diz � m�scara o que deve ser exibido (linhas) */}
              <rect width="100%" height="100%" fill="white" />
              {/* Os c�rculos pretos dizem � m�scara o que deve ser ocultado (dentro das bolas) */}
              {allNodes.map((node) => {
                const isCenter = node.id === 6;
                const conceptIndex = DYNAMIC_CONCEPTS.findIndex(c => c.id === node.id);
                const isActive = conceptIndex === activeIndex;
                
                // Raio aproximado adaptado ao tamanho do bot�o correspondente para encostar exatamente na borda
                let radius = 18; 
                if (isCenter) radius = 30; // Bola central
                else if (isActive) radius = 22; // Bola com highlight (maior)
                
                return (
                  <circle 
                    key={`mask-${node.id}`} 
                    cx={`${node.x}%`} 
                    cy={`${node.y}%`} 
                    r={radius} 
                    fill="black" 
                  />
                );
              })}
            </mask>
          </defs>

          {/* Aplicando a m�scara no grupo de linhas */}
          <g mask="url(#nodes-mask)">
            {GRAPH_CONNECTIONS.map(([sourceId, targetId], index) => {
              const source = allNodes.find(n => n.id === sourceId);
              const target = allNodes.find(n => n.id === targetId);
              const isHighlightedLine = connectionsToHighlight.includes(index);

              return (
                <React.Fragment key={`group-${index}`}>
                  <line
                    x1={`${source.x}%`} y1={`${source.y}%`} 
                    x2={`${target.x}%`} y2={`${target.y}%`}
                    stroke="#262626"
                    strokeWidth="1"
                  />
                  
                  {isHighlightedLine && (
                    <motion.line
                      x1={`${source.x}%`} y1={`${source.y}%`} 
                      x2={`${target.x}%`} y2={`${target.y}%`}
                      stroke="#842CD5"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1, opacity: [0.5, 1, 0.5] }}
                      transition={{ 
                        pathLength: { duration: 1, ease: "easeInOut" },
                        opacity: { duration: 2, repeat: Infinity, ease: "linear" } 
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </g>
        </svg>

        {/* CAMADA HTML: Bot�es posicionados exatamente nas mesmas coordenadas */}
        <div className="absolute inset-0 z-10">
          {allNodes.map((node) => {
            const isCenter = node.id === 6;
            const conceptIndex = DYNAMIC_CONCEPTS.findIndex(c => c.id === node.id);
            const isActive = conceptIndex === activeIndex;
            const Icon = node.icon;

            return (
              <motion.button
                key={node.id}
                onClick={() => !isCenter && onNodeClick(conceptIndex)}
                disabled={isCenter}
                className={`absolute flex items-center justify-center rounded-full border shadow-lg transition-all duration-300 -translate-x-1/2 -translate-y-1/2 ${
                  isCenter 
                    ? 'w-14 h-14 sm:w-16 sm:h-16 bg-[#842CD5] border-[#842CD5] cursor-default z-30' 
                    : isActive 
                      ? 'w-10 h-10 sm:w-12 sm:h-12 bg-[#842CD5]/10 border-[#842CD5] cursor-pointer z-20' 
                      : 'w-8 h-8 sm:w-10 sm:h-10 bg-[#101010] border-[#262626] cursor-pointer hover:border-[#737373] hover:bg-[#1A1A1A] z-10'
                }`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: node.id * 0.15, type: "spring", stiffness: 100 }}
              >
                {isActive && !isCenter && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-[#842CD5]"
                    animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                )}
                {isCenter && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-[#842CD5]"
                    animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.3 }}
                  />
                )}
                
                <Icon className={`relative z-10 transition-colors ${
                  isCenter ? 'w-6 h-6 sm:w-7 sm:h-7 text-[#0A0A0A]' 
                  : isActive ? 'w-4 h-4 sm:w-5 sm:h-5 text-[#842CD5]' 
                  : 'w-3 h-3 sm:w-4 sm:h-4 text-[#737373]'
                }`} />
              </motion.button>
            );
          })}
        </div>
      </div>
      
      <motion.div 
        className="absolute bottom-4 left-4 font-nunito text-xs text-[#262626]"
        animate={{ opacity: [0, 0.7, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        {"[OK] audit --node:442c -> IA:processing"}
      </motion.div>
    </div>
  );
};

// --- COMPONENTE: Hero ---
export default function Hero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const currentConcept = DYNAMIC_CONCEPTS[wordIndex];
  const preposition = currentConcept.word === "ACHISMO." ? "NO" : "NA";

  const handleNodeClick = (index) => {
    setWordIndex(index);
    setText(""); 
    setIsDeleting(false);
  };

  useEffect(() => {
    let timer;

    if (isDeleting) {
      if (text === "") {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % DYNAMIC_CONCEPTS.length);
      } else {
        timer = setTimeout(() => {
          setText(text.slice(0, -1));
        }, 50);
      }
    } else {
      if (text === currentConcept.word) {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 3000);
      } else {
        timer = setTimeout(() => {
          setText(currentConcept.word.slice(0, text.length + 1));
        }, 100);
      }
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex, currentConcept]);

  return (
    <section id="hero" className="relative min-h-[100svh] lg:min-h-[90vh] flex items-center pt-32 pb-16 px-6 bg-transparent border-t-2 border-[#262626]">
      <motion.div 
        className="max-w-7xl mx-auto w-full relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
      >
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-8 lg:space-y-12 w-full min-w-0 lg:pr-6">
            
            <motion.div variants={fadeUp} className="w-full border border-[#262626] bg-[#101010]/80 p-1 pl-4 pr-1 flex items-center gap-3 backdrop-blur-sm">
              <span className="font-nunito text-xs uppercase tracking-widest text-[#898989] flex-1">
                Você já sentiu que poderia alinhar melhor os projetos que gerencia aos objetivos e resultados estratégicos organizacionais?
              </span>
              <div className="w-8 h-8 shrink-0 bg-[#262626] flex items-center justify-center text-[#842CD5]">
                <Code className="w-4 h-4" />
              </div>
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-serif text-5xl sm:text-6xl lg:text-6xl xl:text-7xl font-black leading-[1.05] uppercase w-full break-words text-[#F2EFE9]">
              SUA <br />
              ESTRATÉGIA <br />
              <span className="text-[#525252]">MORRE {preposition}</span> <br />
              
              <span className="inline-block relative text-left whitespace-nowrap">
                <span className="text-[#842CD5]">{text}</span>
                <motion.span
                  className="inline-block w-2.5 h-10 sm:h-12 lg:h-12 xl:h-16 bg-[#842CD5] ml-2 align-middle mb-1"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="max-w-xl text-[#A3A3A3] text-2xl leading-relaxed">
              Potencialize a intuição humana com o auxilio de processamento algorítmico. 
              Somos a plataforma de inteligência que analisa, audita e otimiza sua estratégia de desenvolvimento de ponta a ponta.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
              <a href="#motor-auditoria" className="group border border-[#262626] bg-[#101010] text-[#F2EFE9] font-nunito text-sm uppercase tracking-widest font-bold py-4 sm:py-5 px-8 sm:px-12 hover:bg-[#842CD5] hover:border-[#842CD5] hover:text-[#0A0A0A] transition-all flex justify-center items-center gap-3">
                Iniciar Auditoria <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#como-funciona" className="group border border-[#262626] text-[#737373] font-nunito text-sm uppercase font-bold py-4 sm:py-5 px-8 sm:px-12 hover:border-[#A3A3A3] hover:text-[#710CCD] transition-all text-center">
                Como Funciona
              </a>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="lg:col-span-5 w-full mt-8 lg:mt-0 min-w-0">
            <NodeAuditVisualization activeIndex={wordIndex} onNodeClick={handleNodeClick} />
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}