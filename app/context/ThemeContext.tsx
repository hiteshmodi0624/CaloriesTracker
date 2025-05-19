import React, { createContext, useContext, useState } from 'react';
import { COLORS } from '../constants';

type Theme = {
  colors: {
    primary: string;
    background: string;
    text: string;
  };
};

const lightTheme: Theme = {
  colors: {
    primary: COLORS.blue,
    background: COLORS.white,
    text: COLORS.black,
  },
};

const darkTheme: Theme = {
  colors: {
    primary: COLORS.blue,
    background: COLORS.darkGrey,
    text: COLORS.white,
  },
};

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 