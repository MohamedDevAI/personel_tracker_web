/**
 * Hook for managing theme (dark/light) in-app.
 */

import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<string>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
}

