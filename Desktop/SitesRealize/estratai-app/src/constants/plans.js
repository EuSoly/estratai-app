// ─── Hierarquia de planos ─────────────────────────────────────────────────────
export const PLAN_LEVELS = {
  Starter:    1,
  Business:   2,
  Enterprise: 3,
};

// ─── Cores individuais por plano ─────────────────────────────────────────────
// Starter    → roxo
// Business   → azul/índigo
// Enterprise → pink/magenta
export const PLAN_COLORS = {
  Starter: {
    hex:     '#842CD5',
    bg:      'rgba(132,44,213,0.08)',
    bgHover: 'rgba(132,44,213,0.15)',
    border:  'rgba(132,44,213,0.4)',
  },
  Business: {
    hex:     '#4B37D8',
    bg:      'rgba(75,55,216,0.08)',
    bgHover: 'rgba(75,55,216,0.15)',
    border:  'rgba(75,55,216,0.4)',
  },
  Enterprise: {
    hex:     '#DD20AE',
    bg:      'rgba(221,32,174,0.08)',
    bgHover: 'rgba(221,32,174,0.15)',
    border:  'rgba(221,32,174,0.4)',
  },
};

export const getPlanColor = (plan) => PLAN_COLORS[plan] ?? PLAN_COLORS.Starter;
