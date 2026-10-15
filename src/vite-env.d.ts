/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string;
  readonly VITE_APP_DESCRIPTION?: string;
  readonly VITE_DEFAULT_THEME?: string;
  readonly VITE_PORT?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_API_HEALTH_TIMEOUT?: string;
  readonly VITE_ENABLE_API_LOGGING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
