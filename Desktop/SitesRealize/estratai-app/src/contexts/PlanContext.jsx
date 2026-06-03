import React, { createContext, useContext, useEffect } from 'react';
import { getPlanColor } from '../constants/plans';

const PlanContext = createContext(getPlanColor('Starter'));

function hexToChannels(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export function PlanColorProvider({ plan, children }) {
  const color = getPlanColor(plan);

  useEffect(() => {
    const { r, g, b } = hexToChannels(color.hex);
    const root = document.documentElement;
    root.style.setProperty('--color-plan',    color.hex);
    root.style.setProperty('--color-plan-05', `rgba(${r},${g},${b},0.05)`);
    root.style.setProperty('--color-plan-08', `rgba(${r},${g},${b},0.08)`);
    root.style.setProperty('--color-plan-10', `rgba(${r},${g},${b},0.10)`);
    root.style.setProperty('--color-plan-15', `rgba(${r},${g},${b},0.15)`);
    root.style.setProperty('--color-plan-20', `rgba(${r},${g},${b},0.20)`);
    root.style.setProperty('--color-plan-30', `rgba(${r},${g},${b},0.30)`);
    root.style.setProperty('--color-plan-40', `rgba(${r},${g},${b},0.40)`);
    root.style.setProperty('--color-plan-50', `rgba(${r},${g},${b},0.50)`);
  }, [color.hex]);

  return <PlanContext.Provider value={color}>{children}</PlanContext.Provider>;
}

export const usePlanColor = () => useContext(PlanContext);
