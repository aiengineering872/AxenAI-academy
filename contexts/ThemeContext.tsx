'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme } from '@/types';

// Single dark navy theme - only theme available
const themes: Theme[] = [
  {
    name: 'dark-navy',
    colors: {
      primary: '#ff6b35', // Orange
      secondary: '#ff4500', // Darker orange
      background: '#0a1128', // Dark navy blue
      card: '#1a2332', // Darker navy for cards
      text: '#ffffff',
      textSecondary: '#a0aec0',
      accent: '#ff6b35',
      glow: 'rgba(255, 107, 53, 0.5)', // Orange glow
    },
  },
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeName: string) => void; // No-op, theme switching disabled
  availableThemes: Theme[]; // Always returns single dark-navy theme (for compatibility only)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Force dark-navy theme only - clear any old theme data
    const theme = themes[0];
    setCurrentTheme(theme);
    // Clear any old theme preferences
    localStorage.removeItem('theme');
    localStorage.setItem('theme', 'dark-navy');
    // Force clear any other theme-related storage
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.toLowerCase().includes('theme') && key !== 'theme') {
          localStorage.removeItem(key);
        }
      });
    }
  }, []);

  const setTheme = (themeName: string) => {
    // No-op - theme switching disabled, only dark-navy is allowed
    // Always use dark-navy regardless of input
    const theme = themes[0];
    setCurrentTheme(theme);
    localStorage.setItem('theme', 'dark-navy');
    
    // Apply theme to document root
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  };

  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      Object.entries(currentTheme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
      root.className = currentTheme.name;
    }
  }, [currentTheme, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  // Only provide dark-navy theme
  const darkNavyTheme = themes[0];
  
  return (
    <ThemeContext.Provider value={{ 
      currentTheme: darkNavyTheme, 
      setTheme, 
      availableThemes: [darkNavyTheme] // Only dark-navy
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  // Return default values if context is not available (SSR or provider not mounted)
  if (!context) {
    const defaultTheme = themes[0]; // dark-navy theme
    return {
      currentTheme: defaultTheme,
      setTheme: () => {}, // No-op function
      availableThemes: [defaultTheme], // Only dark-navy
    };
  }
  
  return context;
};

