import React, { createContext, useState, useMemo, useContext, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { lightThemeOptions, darkThemeOptions } from './theme';

// Definição do contexto
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: createTheme(lightThemeOptions),
});

// Hook para usar o tema
export const useAppTheme = () => useContext(ThemeContext);

// Props para o ThemeProvider
interface ThemeProviderProps {
  children: ReactNode;
}

// Componente ThemeProvider
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = useMemo(() => {
    return createTheme(isDarkMode ? darkThemeOptions : lightThemeOptions);
  }, [isDarkMode]);

  const contextValue = useMemo(() => {
    return { isDarkMode, toggleTheme, theme };
  }, [isDarkMode, theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};