import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Network, Edit3, Eye, Zap, Cpu, Database, Sliders, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { usePlanColor } from '../../contexts/PlanContext';

export default function CompanyDNAMap({ 
  projects, 
  availableAgents,
  projectFilesLinks,
  onSelectProject, 
  setProjectToDelete, 
  onRenameProject, 
  onOpenCore,
  onManageFiles,
  initialPositions = {}, 
  initialCoreName = 'CORE_DNA',
  onSaveMapState
}) {
  const { isDark } = useTheme();
  const planColor = usePlanColor();
  const [positions, setPositions] = useState(initialPositions);
  const [contextMenu, setContextMenu] = useState(null);
  
  // Referência para medir a tela real do container e criar a parede dinamicamente
  const containerRef = useRef(null);
  
  // --- SISTEMA DE ZOOM ---
  const [zoom, setZoom] = useState(1);
  const handleZoomIn = () => setZoom(z => Math.min(2, z + 0.1));
  const handleZoomOut = () => setZoom(z => Math.max(0.4, z - 0.1));
  const handleResetZoom = () => setZoom(1);

  const dragRef = useRef(false);
  const dragStartPosRef = useRef({}); 

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [coreName, setCoreName] = useState(initialCoreName);

  const currentPositionsRef = useRef(initialPositions);

  useEffect(() => {
    if (initialPositions && Object.keys(initialPositions).length > 0) {
      setPositions(initialPositions);
      currentPositionsRef.current = initialPositions;
    }
    if (initialCoreName) setCoreName(initialCoreName);
  }, [initialPositions, initialCoreName]);

  useEffect(() => {
    const newPos = { ...currentPositionsRef.current };
    let hasChanges = false;
    
    if (!newPos['core']) {
      newPos['core'] = { x: 0, y: 0 };
      hasChanges = true;
    }

    projects.forEach((proj, idx) => {
      if (!newPos[proj.id]) {
        const angle = (idx / projects.length) * 2 * Math.PI - Math.PI / 2;
        const px = Math.cos(angle) * 280;
        const py = Math.sin(angle) * 200;
        newPos[proj.id] = { x: px, y: py };
        
        newPos[`agent-${proj.id}`] = { x: px + 140, y: py - 40 };
        newPos[`files-${proj.id}`] = { x: px + 140, y: py + 40 };
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      setPositions(newPos);
      currentPositionsRef.current = newPos;
      if (onSaveMapState) onSaveMapState(newPos, coreName);
    }
  }, [projects]);

  // --- CONTROLE DE PAN COM PAREDE INVISÍVEL DINÂMICA ---
  const handleDragStart = (id) => {
    dragRef.current = true;
    dragStartPosRef.current[id] = { 
      x: currentPositionsRef.current[id]?.x || 0, 
      y: currentPositionsRef.current[id]?.y || 0 
    };
  };

  const handleDrag = (id, info) => {
    const start = dragStartPosRef.current[id] || { x: 0, y: 0 };
    
    let newX = start.x + (info.offset.x / zoom);
    let newY = start.y + (info.offset.y / zoom);

    // 🛑 LIMITADOR DE FRONTEIRA DINÂMICO (CÁLCULO DE CÂMERA) 🛑
    let limitX = 1500; 
    let limitY = 1000;

    // Se o container estiver renderizado, lemos o tamanho real dele
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      // Fórmula: (Metade da Tela / Zoom atual) - Margem de segurança do Card
      limitX = (clientWidth / 2) / zoom - 120; // 120px de respiro lateral
      limitY = (clientHeight / 2) / zoom - 80;  // 80px de respiro no topo/base
    }

    // Trava matemática: A carta não pode passar destes limites de jeito nenhum
    newX = Math.max(-limitX, Math.min(limitX, newX));
    newY = Math.max(-limitY, Math.min(limitY, newY));

    const updated = {
      ...currentPositionsRef.current,
      [id]: { x: newX, y: newY }
    };
    
    currentPositionsRef.current = updated;
    setPositions(updated);
    if (contextMenu) setContextMenu(null);
  };

  const handleDragEnd = () => {
    setTimeout(() => { dragRef.current = false; }, 150);
    if (onSaveMapState) {
      onSaveMapState(currentPositionsRef.current, coreName);
    }
  };

  const handleContextMenu = (e, proj) => {
    e.preventDefault(); e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, project: proj, isCore: false });
  };

  const handleCoreContextMenu = (e) => {
    e.preventDefault(); e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, isCore: true });
  };

  const closeMenu = () => setContextMenu(null);

  const handleRenameSubmit = () => {
    if (editingId === 'core') {
      if (editName.trim()) {
        setCoreName(editName);
        if (onSaveMapState) onSaveMapState(currentPositionsRef.current, editName); 
      }
    } else {
      if (editName.trim() && editName !== contextMenu?.project?.name) {
        onRenameProject(editingId, editName);
      }
    }
    setEditingId(null);
  };

  const corePos = positions['core'] || { x: 0, y: 0 };

  return (
    <div 
      ref={containerRef}
      onClick={closeMenu}
      className="relative w-full h-[650px] bg-[#050505] border border-[#262626] overflow-hidden rounded-sm select-none"
    >
      <div className="absolute top-4 right-4 z-50 flex items-center bg-[#101010] border border-[#262626] shadow-2xl rounded-sm">
        <button onClick={handleZoomOut} className="p-2 text-[#737373] hover:text-[var(--color-plan)] hover:bg-[#262626] transition-colors"><ZoomOut size={16} /></button>
        <span className="font-mono text-[10px] text-[#F2EFE9] px-3 border-x border-[#262626] w-[45px] text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={handleZoomIn} className="p-2 text-[#737373] hover:text-[var(--color-plan)] hover:bg-[#262626] transition-colors"><ZoomIn size={16} /></button>
        <button onClick={handleResetZoom} className="p-2 text-[#737373] hover:text-[#710CCD] hover:bg-[#262626] transition-colors border-l border-[#262626]" title="Resetar Visualização"><Maximize size={14} /></button>
      </div>

      {/* Plano cartesiano - pontos (sem linhas) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${isDark ? '#842CD5' : '#7a3fab'} 3px, transparent 3px)`,
          backgroundSize: '35px 35px',
          opacity: isDark ? 0.15 : 0.12
        }}
      />
      
      <motion.div 
        animate={{ scale: zoom }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-0 w-full h-full transform-origin-center pointer-events-none"
      >
        <div className="w-full h-full relative pointer-events-auto">

          <div className="absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none z-0">
            <svg className="overflow-visible">
              <AnimatePresence>
                {projects.map((proj) => {
                  const projPos = positions[proj.id] || { x: 0, y: 0 };
                  const agentPos = positions[`agent-${proj.id}`] || { x: 0, y: 0 };
                  const filesPos = positions[`files-${proj.id}`] || { x: 0, y: 0 };

                  return (
                    <g key={`lines-${proj.id}`}>
                      <line x1={corePos.x} y1={corePos.y} x2={projPos.x} y2={projPos.y} stroke={isDark ? '#262626' : '#C8C5BF'} strokeWidth="2" />
                      <motion.line
                        x1={corePos.x} y1={corePos.y} x2={projPos.x} y2={projPos.y}
                        strokeWidth="2" strokeDasharray="6, 8"
                        animate={{ strokeDashoffset: [0, -28] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ stroke: planColor.hex, opacity: isDark ? 0.7 : 0.9 }}
                      />
                      <path d={`M ${projPos.x} ${projPos.y} C ${projPos.x + 50} ${projPos.y}, ${agentPos.x - 50} ${agentPos.y}, ${agentPos.x} ${agentPos.y}`} fill="transparent" stroke={isDark ? '#262626' : '#C8C5BF'} strokeWidth="1.5" strokeDasharray="4,4" />
                      <path d={`M ${projPos.x} ${projPos.y} C ${projPos.x + 50} ${projPos.y}, ${filesPos.x - 50} ${filesPos.y}, ${filesPos.x} ${filesPos.y}`} fill="transparent" stroke={isDark ? '#262626' : '#C8C5BF'} strokeWidth="1.5" strokeDasharray="4,4" />
                    </g>
                  );
                })}
              </AnimatePresence>
            </svg>
          </div>

          {/* --- CORE DNA --- */}
          <motion.div 
            onPanStart={() => handleDragStart('core')}
            onPan={(e, info) => handleDrag('core', info)}
            onPanEnd={handleDragEnd}
            onContextMenu={handleCoreContextMenu}
            style={{ x: corePos.x, y: corePos.y, left: '50%', top: '50%', marginLeft: '-2.5rem', marginTop: '-3rem' }}
            className="absolute z-30 flex flex-col items-center cursor-grab active:cursor-grabbing group"
          >
            <div onClick={() => { if (!dragRef.current) onOpenCore(); }} className="w-16 h-16 bg-[#0A0A0A] border-2 border-[var(--color-plan)] rounded-full flex items-center justify-center group-hover:bg-[var(--color-plan-10)] transition-all duration-300 relative cursor-pointer" style={{ boxShadow: `0 0 30px ${planColor.bg}` }}>
              <Network size={24} className="text-[var(--color-plan)] group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 border border-[var(--color-plan-30)] rounded-full animate-ping scale-125 opacity-40 pointer-events-none" />
            </div>
            {editingId === 'core' ? (
              <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={handleRenameSubmit} onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()} className="mt-3 bg-[#050505] text-[#F2EFE9] border border-[var(--color-plan)] outline-none font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 font-bold text-center w-28 shadow-lg" />
            ) : (
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#F2EFE9] group-hover:text-[var(--color-plan)] mt-3 bg-[#101010] border border-[#262626] group-hover:border-[var(--color-plan)] px-3 py-1 font-bold transition-all duration-300 shadow-xl">{coreName}</span>
            )}
          </motion.div>

          {/* --- COMPLEXO DE PROJETOS --- */}
          {projects.map((proj) => {
            const projPos = positions[proj.id] || { x: 0, y: 0 };
            const agentPos = positions[`agent-${proj.id}`] || { x: 0, y: 0 };
            const filesPos = positions[`files-${proj.id}`] || { x: 0, y: 0 };
            
            const linkedAgent = availableAgents.find(a => a.id === proj.agent_id);
            const agentName = linkedAgent ? linkedAgent.name : 'Agente Genérico';
            const fileCount = projectFilesLinks ? projectFilesLinks.filter(pf => pf.project_id === proj.id).length : 0;

            return (
              <React.Fragment key={`cluster-${proj.id}`}>
                {/* CARD PRINCIPAL */}
                <motion.div
                  onPanStart={() => handleDragStart(proj.id)}
                  onPan={(e, info) => handleDrag(proj.id, info)}
                  onPanEnd={handleDragEnd}
                  onContextMenu={(e) => handleContextMenu(e, proj)}
                  style={{ x: projPos.x, y: projPos.y, left: '50%', top: '50%', marginLeft: '-6rem', marginTop: '-2.5rem' }}
                  whileHover={{ scale: 1.03, zIndex: 40 }} 
                  whileTap={{ scale: 1.05, zIndex: 50, borderColor: planColor.hex }}
                  className="absolute w-48 bg-[#101010]/95 backdrop-blur-sm border border-[#262626] p-3 cursor-grab active:cursor-grabbing hover:border-[var(--color-plan)] group shadow-2xl z-20"
                >
                  <div className="flex justify-between items-center mb-2 border-b border-[#262626] pb-1">
                    <span className="font-mono text-[9px] text-[#525252] flex items-center gap-1"><Zap size={10} className="text-[var(--color-plan)]"/> PRJ-{proj.id.substring(0, 4).toUpperCase()}</span>
                    <div className="w-1.5 h-1.5 bg-[var(--color-plan)] rounded-full animate-pulse" />
                  </div>
                  {editingId === proj.id ? (
                    <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={handleRenameSubmit} onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()} className="w-full bg-[#050505] text-[#F2EFE9] border border-[var(--color-plan)] outline-none font-serif text-xs font-black uppercase p-1 mb-2 shadow-inner" />
                  ) : (
                    <h4 onDoubleClick={() => { setEditingId(proj.id); setEditName(proj.name); }} className="font-serif text-xs font-black uppercase text-[#F2EFE9] group-hover:text-[var(--color-plan)] transition-colors truncate mb-3">{proj.name}</h4>
                  )}
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-mono text-[8px] text-[#525252]">NÓ_DE_AÇÃO</span>
                    <button onClick={() => { if (!dragRef.current) onSelectProject(proj); }} className="font-mono text-[8px] bg-[var(--color-plan-10)] px-2 py-1 uppercase tracking-widest text-[var(--color-plan)] hover:bg-[var(--color-plan)] hover:text-[#0A0A0A] transition-colors cursor-pointer relative z-50">ACESSAR</button>
                  </div>
                </motion.div>

                {/* SATÉLITE: AGENTE */}
                <motion.div
                  onPanStart={() => handleDragStart(`agent-${proj.id}`)}
                  onPan={(e, info) => handleDrag(`agent-${proj.id}`, info)}
                  onPanEnd={handleDragEnd}
                  style={{ x: agentPos.x, y: agentPos.y, left: '50%', top: '50%', marginLeft: '-4.5rem', marginTop: '-1rem' }}
                  whileHover={{ scale: 1.05, zIndex: 40 }}
                  className="absolute w-36 bg-[#0A0A0A] border border-[#262626] p-2 cursor-grab active:cursor-grabbing shadow-xl z-10 flex items-center gap-2"
                >
                  <div className="p-1 bg-[#262626] rounded-sm text-[#A3A3A3]"><Cpu size={12} /></div>
                  <div className="flex flex-col truncate">
                    <span className="font-mono text-[7px] text-[#525252] uppercase">Motor de IA</span>
                    <span className="font-sans text-[10px] font-bold text-[#F2EFE9] truncate">{agentName}</span>
                  </div>
                </motion.div>

                {/* SATÉLITE: DOCUMENTOS */}
                <motion.div
                  onPanStart={() => handleDragStart(`files-${proj.id}`)}
                  onPan={(e, info) => handleDrag(`files-${proj.id}`, info)}
                  onPanEnd={handleDragEnd}
                  onClick={() => { if (!dragRef.current) onManageFiles(proj); }}
                  style={{ x: filesPos.x, y: filesPos.y, left: '50%', top: '50%', marginLeft: '-4.5rem', marginTop: '-1rem' }}
                  whileHover={{ scale: 1.05, zIndex: 40, borderColor: '#737373' }}
                  className="absolute w-36 bg-[#0A0A0A] border border-[#262626] hover:bg-[#101010] p-2 cursor-grab active:cursor-grabbing shadow-xl z-10 flex items-center gap-2 group transition-colors"
                >
                  <div className="p-1 bg-[#262626] group-hover:bg-[var(--color-plan)]/20 group-hover:text-[var(--color-plan)] rounded-sm text-[#A3A3A3] transition-colors"><Database size={12} /></div>
                  <div className="flex flex-col truncate">
                    <span className="font-mono text-[7px] text-[#525252] uppercase">Base Contextual</span>
                    <span className="font-sans text-[10px] font-bold text-[#F2EFE9] truncate">{fileCount} Arquivo(s)</span>
                  </div>
                </motion.div>

              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

      {/* MENU DE CONTEXTO */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -5 }}
            style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }}
            className="z-[100] w-48 bg-[#0A0A0A]/95 backdrop-blur-md border border-[#262626] shadow-2xl py-1 flex flex-col rounded-2xs"
          >
            <div className="px-3 py-2 border-b border-[#262626] mb-1 bg-[#050505]">
              <span className="font-mono text-[9px] uppercase text-[#737373] tracking-widest truncate block font-bold">{contextMenu.isCore ? coreName : contextMenu.project.name}</span>
            </div>
            {contextMenu.isCore ? (
              <>
                <button onClick={() => { onOpenCore(); closeMenu(); }} className="px-4 py-2.5 text-left font-mono text-[10px] text-[#F2EFE9] hover:bg-[#101010] hover:text-[var(--color-plan)] uppercase tracking-widest flex items-center gap-3 transition-colors"><Sliders size={12}/> Configurar DNA</button>
                <button onClick={() => { setEditingId('core'); setEditName(coreName); closeMenu(); }} className="px-4 py-2.5 text-left font-mono text-[10px] text-[#F2EFE9] hover:bg-[#101010] hover:text-[var(--color-plan)] uppercase tracking-widest flex items-center gap-3 transition-colors"><Edit3 size={12}/> Renomear DNA</button>
              </>
            ) : (
              <>
                <button onClick={() => { onSelectProject(contextMenu.project); closeMenu(); }} className="px-4 py-2.5 text-left font-mono text-[10px] text-[#F2EFE9] hover:bg-[#101010] hover:text-[var(--color-plan)] uppercase tracking-widest flex items-center gap-3 transition-colors"><Eye size={12}/> Acessar Sala de Estratégia</button>
                <button onClick={() => { setEditingId(contextMenu.project.id); setEditName(contextMenu.project.name); closeMenu(); }} className="px-4 py-2.5 text-left font-mono text-[10px] text-[#F2EFE9] hover:bg-[#101010] hover:text-[var(--color-plan)] uppercase tracking-widest flex items-center gap-3 transition-colors"><Edit3 size={12}/> Renomear</button>
                <div className="h-px bg-[#262626] my-1 mx-2" />
                <button onClick={() => { setProjectToDelete(contextMenu.project); closeMenu(); }} className="px-4 py-2.5 text-left font-mono text-[10px] text-red-500/80 hover:bg-red-900/20 hover:text-red-500 uppercase tracking-widest flex items-center gap-3 transition-colors"><Trash2 size={12}/> Deletar Projeto</button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}