import { useState, useEffect } from 'react';

const DEFAULT_PREFS = {
  // Aparência
  theme: 'dark', // 'dark' ou 'light'

  // Notificações
  emailNotifications: true,
  pushNotifications: false,
  weeklyDigest: true,

  // UI Preferences
  sidebarCollapsed: false,
  compactMode: false,
  animationsEnabled: true,
};

const STORAGE_KEY = 'estratai_userPreferences';

/**
 * Hook para gerenciar preferências do usuário em localStorage
 * Sincroniza automaticamente entre abas via storage event
 */
export function useUserPreferences() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega preferências do localStorage na montagem
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPrefs(prev => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error('Erro ao carregar preferências:', err);
    }
    setIsLoaded(true);
  }, []);

  // Sincroniza entre abas quando localStorage muda
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setPrefs(prev => ({ ...prev, ...parsed }));
        } catch (err) {
          console.error('Erro ao sincronizar preferências:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Atualiza uma preferência específica
  const updatePref = (key, value) => {
    setPrefs(prev => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Erro ao salvar preferência:', err);
      }
      return updated;
    });
  };

  // Atualiza múltiplas preferências de uma vez
  const updateMultiple = (updates) => {
    setPrefs(prev => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Erro ao salvar preferências:', err);
      }
      return updated;
    });
  };

  // Reseta para padrões
  const resetPrefs = () => {
    setPrefs(DEFAULT_PREFS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Erro ao resetar preferências:', err);
    }
  };

  return {
    prefs,
    updatePref,
    updateMultiple,
    resetPrefs,
    isLoaded,
  };
}

export default useUserPreferences;
