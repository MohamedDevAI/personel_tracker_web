/**
 * Application-wide environment configuration.
 * Centralizes and types all Vite environment variables (`import.meta.env.VITE_*`).
 * Provides safe fallback defaults when variables are not specified.
 */

export const env = {
  // ── App Metadata ──────────────────────────────────────────────────────────
  appTitle: import.meta.env.VITE_APP_TITLE,
  appDescription:
    import.meta.env.VITE_APP_DESCRIPTION,
  defaultTheme: (import.meta.env.VITE_DEFAULT_THEME === 'light' ? 'light' : 'dark') as 'light' | 'dark',

  // ── Dev Server Settings ───────────────────────────────────────────────────
  port: Number(import.meta.env.VITE_PORT),

  // ── Backend & API Connection ──────────────────────────────────────────────
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  backendUrl: import.meta.env.VITE_BACKEND_URL,

  // ── API Timeouts (ms) ─────────────────────────────────────────────────────
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT),
  apiHealthTimeout: Number(import.meta.env.VITE_API_HEALTH_TIMEOUT),

  // ── Diagnostics & Logging ─────────────────────────────────────────────────
  enableApiLogging:
    import.meta.env.VITE_ENABLE_API_LOGGING === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_ENABLE_API_LOGGING !== 'false'),
} as const;

export default env;
