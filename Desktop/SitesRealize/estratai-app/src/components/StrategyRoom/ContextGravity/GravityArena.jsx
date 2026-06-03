import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, FileText, BrainCircuit, Eye, Sliders, Trash2 } from 'lucide-react';
import { usePlanColor } from '../../../contexts/PlanContext';

const ICON_LIBRARY = { file: FileText, brain: BrainCircuit, target: Target, eye: Eye };
const MAX_DIST  = 360;
const RING_R    = 26;
const RING_CIRC = 2 * Math.PI * RING_R; // ≈ 163.4

function getInfluence(x, y) {
  return Math.max(0, 1 - Math.sqrt(x * x + y * y) / MAX_DIST);
}

function getIntentColor(file, planHex = '#842CD5') {
  if (file.customColor) return file.customColor;
  if (file.intent === 'good' || file.intent === 'bom') return '#10b981';
  if (file.intent === 'bad'  || file.intent === 'ruim') return '#ef4444';
  return planHex;
}

function getAura(intent, customColor) {
  if (customColor) return `0 0 22px ${customColor}88, 0 0 44px ${customColor}33`;
  if (intent === 'good' || intent === 'bom')  return '0 0 22px rgba(16,185,129,0.65), 0 0 44px rgba(16,185,129,0.22)';
  if (intent === 'bad'  || intent === 'ruim') return '0 0 22px rgba(239,68,68,0.65),  0 0 44px rgba(239,68,68,0.22)';
  return '0 0 6px rgba(38,38,38,0.5)';
}

// Anel de influência — SVG automático alinhado ao nó (48×48 viewBox)
function InfluenceRing({ x, y, color }) {
  const dashOffset = RING_CIRC * (1 - getInfluence(x, y));
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 48 48"
      overflow="visible"
    >
      <circle cx="24" cy="24" r={RING_R} fill="none" stroke="#1c1c1c" strokeWidth="2" />
      <circle
        cx="24" cy="24" r={RING_R}
        fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={RING_CIRC} strokeDashoffset={dashOffset}
        style={{
          transformBox: 'fill-box',
          transformOrigin: 'center',
          transform: 'rotate(-90deg)',
          transition: 'stroke-dashoffset 0.35s ease',
        }}
      />
    </svg>
  );
}

export default function GravityArena({ files, onDragEnd, onEditNode, onUnlinkNode }) {
  const planColor = usePlanColor();
  const containerRef  = useRef(null);
  const [center, setCenter]           = useState({ x: 0, y: 0 });
  const [nodeContextMenu, setNodeContextMenu] = useState(null);

  // Rastreia o centro do container para o SVG das linhas de conexão
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      setCenter({
        x: containerRef.current.offsetWidth  / 2,
        y: containerRef.current.offsetHeight / 2,
      });
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const close = () => setNodeContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  return (
    <div
      ref={containerRef}
      onContextMenu={e => e.preventDefault()}
      className="flex-1 w-full h-full min-h-[620px] relative flex items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#121212] to-[#0A0A0A]"
    >
      {/* Keyframe CSS para linhas fluindo em direção ao núcleo */}
      <style>{`
        @keyframes flowToNucleus {
          from { stroke-dashoffset: 20; }
          to   { stroke-dashoffset: 0;  }
        }
      `}</style>

      {/* ── Campo gravitacional ──────────────────────────────────────── */}
      <div className="absolute pointer-events-none rounded-full" style={{
        width: '560px', height: '560px',
        background: `radial-gradient(ellipse at center, ${planColor.bg} 0%, ${planColor.bg.replace('0.08', '0.025')} 38%, transparent 70%)`,
      }} />
      {[{ r: 210, op: 0.06 }, { r: 138, op: 0.10 }, { r: 72, op: 0.16 }].map(({ r, op }) => {
        const { r: cr, g: cg, b: cb } = { r: parseInt(planColor.hex.slice(1,3),16), g: parseInt(planColor.hex.slice(3,5),16), b: parseInt(planColor.hex.slice(5,7),16) };
        return (
          <div key={r} className="absolute rounded-full pointer-events-none" style={{
            width: r * 2, height: r * 2,
            border: `1px solid rgba(${cr},${cg},${cb},${op})`,
            boxShadow: `inset 0 0 ${r * 0.3}px rgba(${cr},${cg},${cb},${op * 0.4})`,
          }} />
        );
      })}

      {/* ── Linhas de conexão ao núcleo ─────────────────────────────── */}
      {center.x > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 6 }}
        >
          <g transform={`translate(${center.x}, ${center.y})`}>
            {files.map(file => {
              const influence = getInfluence(file.x, file.y);
              if (influence < 0.04) return null;

              const color    = getIntentColor(file, planColor.hex);
              const duration = (0.8 + (1 - influence) * 1.8).toFixed(2); // rápido perto, lento longe

              return (
                <line
                  key={file.id}
                  x1={file.x} y1={file.y}
                  x2={0}      y2={0}
                  stroke={color}
                  strokeWidth={0.5 + influence * 2.5}
                  strokeOpacity={0.07 + influence * 0.52}
                  strokeDasharray="4 10"
                  style={{ animation: `flowToNucleus ${duration}s linear infinite` }}
                />
              );
            })}
          </g>
        </svg>
      )}

      {/* ── Núcleo central ──────────────────────────────────────────── */}
      <div className="absolute z-10 w-24 h-24 bg-[#101010] border-2 border-[var(--color-plan)] rounded-full flex flex-col items-center justify-center text-center p-2 cursor-default" style={{ boxShadow: `0 0 50px ${planColor.border}, inset 0 0 24px ${planColor.bg}` }}>
        <div className="w-2.5 h-2.5 bg-[var(--color-plan)] animate-ping absolute -top-1 rounded-full" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-plan)] font-black">NÚCLEO</span>
        <span className="font-serif text-[10px] uppercase text-[#F2EFE9] font-bold mt-1">MATRIZ</span>
      </div>

      {/* ── Nós dos arquivos ────────────────────────────────────────── */}
      {files.map(file => {
        const influence    = getInfluence(file.x, file.y);
        const intentColor  = getIntentColor(file, planColor.hex);
        const IconComponent = ICON_LIBRARY[file.customIcon] || ICON_LIBRARY[file.type] || FileText;

        const isBad  = file.intent === 'bad'  || file.intent === 'ruim';
        const isGood = file.intent === 'good' || file.intent === 'bom';
        let borderColor = '#262626';
        if (isGood) borderColor = '#10b981';
        if (isBad)  borderColor = '#ef4444';
        if (file.customColor) borderColor = file.customColor;

        return (
          <motion.div
            key={file.id}
            id={`node-${file.id}`}
            drag
            dragConstraints={containerRef}
            dragMomentum={false}
            dragElastic={0}
            initial={{ x: file.x, y: file.y }}
            animate={{ x: file.x, y: file.y }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onDragEnd={(e, info) => {
              const nodeEl = document.getElementById(`node-${file.id}`);
              let finalX = file.x + info.offset.x;
              let finalY = file.y + info.offset.y;
              if (nodeEl && containerRef.current) {
                const cRect = containerRef.current.getBoundingClientRect();
                const nRect = nodeEl.getBoundingClientRect();
                finalX = (nRect.left + nRect.width  / 2) - (cRect.left + cRect.width  / 2);
                finalY = (nRect.top  + nRect.height / 2) - (cRect.top  + cRect.height / 2);
              }
              onDragEnd(file.id, finalX, finalY);
            }}
            onContextMenu={e => {
              e.preventDefault();
              e.stopPropagation();
              setNodeContextMenu({ x: e.clientX, y: e.clientY, fileId: file.id });
            }}
            style={{ borderColor, boxShadow: getAura(file.intent, file.customColor) }}
            className="absolute w-12 h-12 bg-[#101010] border-2 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing group z-20"
          >
            {/* Anel de influência */}
            <InfluenceRing x={file.x} y={file.y} color={intentColor} />

            {/* Ícone */}
            <IconComponent
              size={16}
              className="relative z-10 transition-colors group-hover:brightness-125"
              style={{ color: intentColor }}
            />

            {/* Tooltip: nome + % de influência */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30 flex flex-col items-center gap-0.5">
              <span
                className="font-mono text-[9px] whitespace-nowrap px-2 py-0.5 border"
                style={{ color: intentColor, borderColor: `${intentColor}50`, backgroundColor: '#0A0A0A' }}
              >
                {Math.round(influence * 100)}% influência
              </span>
              <span className="font-mono text-[10px] text-[#A3A3A3] whitespace-nowrap bg-[#0A0A0A] px-2 py-0.5 border border-[#262626]">
                {file.name}
              </span>
            </div>
          </motion.div>
        );
      })}

      {/* ── Menu de contexto ─────────────────────────────────────────── */}
      <AnimatePresence>
        {nodeContextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ top: nodeContextMenu.y, left: nodeContextMenu.x, position: 'fixed' }}
            className="z-50 bg-[#0A0A0A] border border-[#262626] w-44 py-1 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { onEditNode(nodeContextMenu.fileId); setNodeContextMenu(null); }}
              className="w-full px-4 py-2 text-left font-mono text-[10px] text-[#F2EFE9] hover:bg-[#101010] hover:text-[var(--color-plan)] uppercase tracking-widest flex items-center gap-2.5 transition-colors"
            >
              <Sliders size={12} /> Configurar Nó
            </button>
            <div className="h-px bg-[#262626] my-1 mx-2" />
            <button
              onClick={() => { onUnlinkNode(nodeContextMenu.fileId); setNodeContextMenu(null); }}
              className="w-full px-4 py-2 text-left font-mono text-[10px] text-red-500 hover:bg-[#101010] uppercase tracking-widest flex items-center gap-2.5 transition-colors"
            >
              <Trash2 size={12} /> Desvincular
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
