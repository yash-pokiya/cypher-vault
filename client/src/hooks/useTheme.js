import { useState, useCallback, useEffect } from 'react';
import { toggleTheme, getTheme, initTheme } from '../utils/theme';

export function useTheme() {
  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    const active = initTheme();
    setTheme(active);
  }, []);

  const toggle = useCallback(() => {
    const next = toggleTheme();
    setTheme(next);
  }, []);

  return { theme, toggle, isDark: theme === 'dark' };
}
