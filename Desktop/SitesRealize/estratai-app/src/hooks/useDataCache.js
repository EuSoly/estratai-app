import { create } from 'zustand';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

const createCacheStore = () => {
  return create((set, get) => ({
    cache: {},
    timestamps: {},
    pending: {},

    set: (key, data, ttl = DEFAULT_TTL) => {
      set((state) => ({
        cache: { ...state.cache, [key]: data },
        timestamps: { ...state.timestamps, [key]: Date.now() + ttl },
      }));
    },

    get: (key) => {
      const state = get();
      const timestamp = state.timestamps[key];

      // Cache expirado
      if (timestamp && Date.now() > timestamp) {
        set((state) => ({
          cache: { ...state.cache, [key]: undefined },
          timestamps: { ...state.timestamps, [key]: undefined },
        }));
        return null;
      }

      return state.cache[key] || null;
    },

    invalidate: (key) => {
      set((state) => ({
        cache: { ...state.cache, [key]: undefined },
        timestamps: { ...state.timestamps, [key]: undefined },
        pending: { ...state.pending, [key]: undefined },
      }));
    },

    invalidateAll: () => {
      set({
        cache: {},
        timestamps: {},
        pending: {},
      });
    },

    // Deduplicação: se uma request já está em andamento, reutiliza a promise
    getPending: (key) => get().pending[key],
    setPending: (key, promise) => {
      set((state) => ({ pending: { ...state.pending, [key]: promise } }));
    },
    clearPending: (key) => {
      set((state) => ({ pending: { ...state.pending, [key]: undefined } }));
    },
  }));
};

const cacheStore = createCacheStore();

// Hook de conveniência
export const useDataCache = () => {
  const cache = cacheStore();

  return {
    // Projects
    getProjects: () => cache.get('projects'),
    setProjects: (data) => cache.set('projects', data, 5 * 60 * 1000),
    invalidateProjects: () => cache.invalidate('projects'),

    // Vault items
    getVaultItems: () => cache.get('vault_items'),
    setVaultItems: (data) => cache.set('vault_items', data, 5 * 60 * 1000),
    invalidateVaultItems: () => cache.invalidate('vault_items'),

    // Agents
    getAgents: () => cache.get('agents'),
    setAgents: (data) => cache.set('agents', data, 10 * 60 * 1000), // TTL maior pois agentes são estáticos
    invalidateAgents: () => cache.invalidate('agents'),

    // Project files links
    getProjectFiles: () => cache.get('project_files'),
    setProjectFiles: (data) => cache.set('project_files', data, 5 * 60 * 1000),
    invalidateProjectFiles: () => cache.invalidate('project_files'),

    // Map settings
    getMapSettings: () => cache.get('map_settings'),
    setMapSettings: (data) => cache.set('map_settings', data, 10 * 60 * 1000),
    invalidateMapSettings: () => cache.invalidate('map_settings'),

    // Utility
    invalidateAll: () => cache.invalidateAll(),
  };
};

// Exporta a store para uso direto também
export default cacheStore;
