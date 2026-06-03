import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle2, File, Lock, Zap, Folder, ArrowLeft, Search } from 'lucide-react';

import { PLAN_LEVELS, getPlanColor } from '../../../constants/plans';

export default function ModalCreateProject({ 
  isOpen, onClose, step, setStep, newProject, setNewProject, 
  vaultItems, availableAgents, userPlan, toggleFileSelection, handleNextStep 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);

  const currentFolderObj = vaultItems.find(f => f.id === currentFolder);
  const filteredItems = vaultItems.filter(item => {
    if (searchTerm) return item.type !== 'folder' && item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const itemParent = item.parent_id || item.parentId || null;
    return itemParent === currentFolder;
  });

  const handleBack = () => {
    if (currentFolderObj) setCurrentFolder(currentFolderObj.parent_id || currentFolderObj.parentId || null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-[#101010] border border-[#262626] shadow-2xl flex flex-col h-[650px]">
            
            <div className="p-6 border-b border-[#262626] flex justify-between items-center bg-[#0A0A0A]">
              <div>
                <h3 className="font-serif text-2xl font-bold uppercase text-[#F2EFE9]">Setup Tático</h3>
                <div className="flex gap-2 mt-2">{[1, 2, 3].map(i => (<div key={i} className={`h-1 w-8 ${step >= i ? 'bg-[var(--color-plan)]' : 'bg-[#262626]'}`} />))}</div>
              </div>
              <button onClick={() => { setSearchTerm(''); setCurrentFolder(null); onClose(); setStep(1); }} className="text-[#525252] hover:text-[#710CCD]"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-[#050505]">
              <AnimatePresence mode="wait">
                
                {/* --- PASSO 1: NOME DO PROJETO --- */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--color-plan)]">01. Identificação</h4>
                    <input autoFocus type="text" placeholder="Nome do Projeto..." value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleNextStep()} className="w-full bg-[#0A0A0A] border border-[#262626] p-4 text-[#F2EFE9] outline-none focus:border-[var(--color-plan)]" />
                  </motion.div>
                )}
                
                {/* --- PASSO 2: SELEÇÃO DE ARQUIVOS (RAG) --- */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 h-full flex flex-col">
                    <div className="flex justify-between items-end">
                      <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--color-plan)]">02. Contexto de Dados</h4>
                      <span className="font-mono text-[9px] uppercase text-[var(--color-plan)] bg-[var(--color-plan-10)] px-2 py-1">{newProject.files.length} Selecionado(s)</span>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#262626] p-3 focus-within:border-[var(--color-plan)] transition-colors">
                      <Search size={14} className="text-[#525252]" />
                      <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-[#F2EFE9] font-sans text-sm w-full" />
                    </div>

                    <div className="flex-1 border border-[#262626] bg-[#0A0A0A] overflow-y-auto p-2">
                      {!searchTerm && currentFolder && (
                        <div onClick={handleBack} className="flex items-center gap-3 p-3 mb-2 bg-[#101010] border border-[#262626] cursor-pointer hover:border-[var(--color-plan)] text-[#A3A3A3] hover:text-[var(--color-plan)]">
                          <ArrowLeft size={14} /> <span className="font-mono text-[10px] uppercase font-bold">Voltar ({currentFolderObj?.name || 'Pasta Anterior'})</span>
                        </div>
                      )}

                      {filteredItems.length === 0 ? (
                        <div className="p-8 text-center text-[#525252] font-mono text-xs uppercase">Vazio.</div>
                      ) : (
                        filteredItems.map(item => {
                          if (item.type === 'folder') {
                            return (
                              <div key={item.id} onClick={() => setCurrentFolder(item.id)} className="flex items-center gap-3 p-3 cursor-pointer border-b border-[#262626] hover:bg-[#101010]">
                                <Folder size={16} className="text-[var(--color-plan)]" /> <span className="font-sans text-sm text-[#F2EFE9] truncate flex-1">{item.name}</span>
                              </div>
                            );
                          }
                          const isSelected = newProject.files.includes(item.id);
                          return (
                            <div key={item.id} onClick={() => toggleFileSelection(item.id, 'project')} className={`flex items-center gap-3 p-3 cursor-pointer border-b border-[#262626] ${isSelected ? 'bg-[var(--color-plan-05)] border-l-2 border-l-[var(--color-plan)]' : 'hover:bg-[#101010]'}`}>
                              <div className={`w-3 h-3 border flex items-center justify-center ${isSelected ? 'border-[var(--color-plan)] bg-[var(--color-plan)]' : 'border-[#525252]'}`}>{isSelected && <CheckCircle2 size={10} className="text-[#0A0A0A]" />}</div>
                              <File size={14} className="text-[#525252]" /> <span className={`font-sans text-sm truncate ${isSelected ? 'text-[#F2EFE9] font-bold' : 'text-[#A3A3A3]'}`}>{item.name}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}

                {/* --- PASSO 3: MOTOR DE IA (AGENTES RESTAURADOS) --- */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--color-plan)]">03. Motor Algorítmico</h4>
                    <div className="space-y-3">
                      {availableAgents.map(agent => {
                        const isLocked = (PLAN_LEVELS[userPlan] || 1) < (PLAN_LEVELS[agent.plan_required] || 1);
                        
                        return (
                          <div 
                            key={agent.id} 
                            onClick={() => !isLocked && setNewProject({...newProject, agent: agent.id})} 
                            className={`border p-4 transition-all relative ${isLocked ? 'border-[#262626] bg-[#0A0A0A] opacity-50 cursor-not-allowed' : newProject.agent === agent.id ? 'border-[var(--color-plan)] bg-[var(--color-plan-05)] cursor-pointer' : 'border-[#262626] bg-[#101010] hover:border-[#525252] cursor-pointer'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-3">
                                {isLocked ? <Lock size={16} className="text-[#525252]" /> : <Zap size={16} className={newProject.agent === agent.id ? 'text-[var(--color-plan)]' : 'text-[#525252]'} />}
                                <span className={`font-serif text-lg font-bold ${newProject.agent === agent.id ? 'text-[var(--color-plan)]' : 'text-[#F2EFE9]'}`}>{agent.name}</span>
                              </div>
                              {(() => {
                                const c = getPlanColor(agent.plan_required);
                                return (
                                  <span
                                    className="font-mono text-[10px] uppercase px-2 py-1"
                                    style={isLocked
                                      ? { backgroundColor: '#1a1a1a', color: '#737373' }
                                      : { backgroundColor: c.bg, color: c.hex, border: `1px solid ${c.border}` }
                                    }
                                  >
                                    Plano {agent.plan_required}
                                  </span>
                                );
                              })()}
                            </div>
                            <p className="font-sans text-sm text-[#737373] ml-7">{agent.description}</p>
                            
                            {isLocked && (
                              <button className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 bg-[#0A0A0A]/90 backdrop-blur-sm transition-opacity font-mono text-xs uppercase tracking-widest text-[var(--color-plan)] font-bold">
                                Upgrade Necessário
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="p-6 border-t border-[#262626] flex justify-between bg-[#0A0A0A]">
              <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="font-mono text-xs uppercase tracking-widest text-[#737373] hover:text-[#710CCD] px-4 py-3">{step > 1 ? 'Voltar' : 'Cancelar'}</button>
              <button onClick={handleNextStep} disabled={(step === 1 && !newProject.name) || (step === 2 && newProject.files.length === 0) || (step === 3 && !newProject.agent)} className="bg-[var(--color-plan)] text-[#0A0A0A] px-8 py-3 font-mono text-xs uppercase font-bold hover:bg-[#710CCD] disabled:opacity-30 flex items-center gap-2">{step === 3 ? 'Iniciar Motor' : 'Avançar'} <ArrowRight size={14} /></button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}