import { useState, useEffect } from 'react';
import theme from '../theme';

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState(theme);

  useEffect(() => {
    // Detecta preferência do sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Aplica o tema baseado na preferência
    setCurrentTheme(theme);

    // Listener para mudanças na preferência do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setCurrentTheme(theme);
    };

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return { theme: currentTheme };
};
