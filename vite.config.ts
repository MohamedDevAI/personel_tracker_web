import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode and project root
  const env = loadEnv(mode, process.cwd(), '');

  const serverPort = Number(env.VITE_PORT) || 5173;
  const apiBaseUrl = env.VITE_API_BASE_URL || '/api';
  const backendTarget = env.VITE_BACKEND_URL || 'http://localhost:8080';

  return {
    plugins: [react()],
    server: {
      port: serverPort,
      proxy: {
        [apiBaseUrl]: {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
