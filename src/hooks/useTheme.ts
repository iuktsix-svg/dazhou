import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('dz-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dz-theme', theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  }, []);

  return { theme, toggle };
}
