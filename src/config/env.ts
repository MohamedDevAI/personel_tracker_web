/**
 * Application-wide environment configuration.
 * Centralizes and types all Vite environment variables (`import.meta.env.VITE_*`).
 * Provides safe fallback defaults when variables are not specified.
 */

export const env = {
  // ── App Metadata ──────────────────────────────────────────────────────────
  appTitle: import.meta.env.VITE_APP_TITLE || 'Personal Tracker',
  appDescription:
    import.meta.env.VITE_APP_DESCRIPTION ||
    'International-grade personal tracker for habits, financial cash flow, strategic goals, and daily tasks with real-time analytics.',
  defaultTheme: (import.meta.env.VITE_DEFAULT_THEME === 'dark' ? 'dark' : 'light') as 'light' | 'dark',

  // ── Dev Server Settings ───────────────────────────────────────────────────
  port: Number(import.meta.env.VITE_PORT) || 5173,

  // ── Backend & API Connection ──────────────────────────────────────────────
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080',

  // ── API Timeouts (ms) ─────────────────────────────────────────────────────
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 6000,
  apiHealthTimeout: Number(import.meta.env.VITE_API_HEALTH_TIMEOUT) || 8000,

  // ── Diagnostics & Logging ─────────────────────────────────────────────────
  enableApiLogging:
    import.meta.env.VITE_ENABLE_API_LOGGING === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_ENABLE_API_LOGGING !== 'false'),
} as const;

export default env;
