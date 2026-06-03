// ============================================================================
// Environment Configuration
// ============================================================================
// Centralized configuration from environment variables
// All hardcoded values should be moved here

export const config = {
  // Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },

  // Application
  app: {
    name: import.meta.env.VITE_APP_NAME || 'EstratAI',
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  },

  // N8N Webhook
  n8n: {
    webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL,
  },

  // File Upload Constraints
  fileUpload: {
    maxSizeMB: parseInt(import.meta.env.VITE_MAX_FILE_SIZE_MB || '20'),
    allowedTypes: (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'pdf,docx,pptx,xlsx,csv,txt').split(','),
  },

  // UI/UX Configuration
  ui: {
    searchDebounceMs: parseInt(import.meta.env.VITE_SEARCH_DEBOUNCE_MS || '300'),
    sessionTimeoutMinutes: parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES || '30'),
    tokenRefreshMinutes: parseInt(import.meta.env.VITE_TOKEN_REFRESH_MINUTES || '25'),
  },

  // Feature Flags
  features: {
    exportPdf: import.meta.env.VITE_FEATURE_EXPORT_PDF !== 'false',
    webhook: import.meta.env.VITE_FEATURE_WEBHOOK !== 'false',
    planGating: import.meta.env.VITE_FEATURE_PLAN_GATING !== 'false',
  },

  // Debug/Logging
  debug: {
    enabled: import.meta.env.VITE_DEBUG === 'true',
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  },

  // Plans (from CLAUDE.md)
  plans: {
    STARTER: import.meta.env.VITE_PLAN_STARTER || 'Starter',
    BUSINESS: import.meta.env.VITE_PLAN_BUSINESS || 'Business',
    ENTERPRISE: import.meta.env.VITE_PLAN_ENTERPRISE || 'Enterprise',
  },
};

// Validation: ensure critical vars are set
const requiredVars = ['supabase.url', 'supabase.anonKey'];
requiredVars.forEach(varPath => {
  const [obj, key] = varPath.split('.');
  if (!config[obj]?.[key]) {
    console.error(`❌ Missing required environment variable: VITE_${varPath.toUpperCase().replace('.', '_')}`);
  }
});

export default config;
