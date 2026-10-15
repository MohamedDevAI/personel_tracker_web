/**
 * Hook for applying the application theme.
 *
 * Configures `data-theme="light"` on the document root for theme attribute selectors.
 */

import { useEffect } from 'react';
import { env } from '../config/env';

export const APP_THEME = env.defaultTheme;

export function useTheme() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', APP_THEME);
  }, []);

  return { theme: APP_THEME };
}
