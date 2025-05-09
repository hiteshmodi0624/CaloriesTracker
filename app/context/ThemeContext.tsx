import React, { createContext, useContext, useState } from 'react';

type Theme = {
  colors: {
    primary: string;
    background: string;
    text: string;
  };
};

const lightTheme: Theme = {
  colors: {
    primary: '#4CAF50',
    background: '#FFFFFF',
    text: '#000000',
  },
};

const darkTheme: Theme = {
  colors: {
    primary: '#4CAF50',
    background: '#121212',
    text: '#FFFFFF',
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