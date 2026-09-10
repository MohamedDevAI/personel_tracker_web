/**
 * Hook for managing theme (dark/light) with localStorage persistence.
 */

import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

export function useTheme() {
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
}
