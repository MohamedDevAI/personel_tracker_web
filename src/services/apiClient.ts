/**
 * Shared Axios instance for all API services.
 * Centralizes base URL, timeouts, headers, and error interceptors.
 */

import axios from 'axios';
import { env } from '../config/env';

const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Response Interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log API errors for debugging if enabled, but let callers handle them
    if (env.enableApiLogging) {
      if (error.response) {
        console.warn(
          `[API ${error.response.status}] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
          error.response.data
        );
      } else if (error.request) {
        console.warn(`[API Timeout/Network] ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
