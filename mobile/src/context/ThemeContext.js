import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../theme/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme_mode');
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (e) {
      console.error('Failed to load theme.', e);
    } finally {
      setIsReady(true);
    }
  };

  const updateThemeMode = async (mode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem('@theme_mode', mode);
    } catch (e) {
      console.error('Failed to save theme.', e);
    }
  };

  // Determine active theme
  let activeTheme;
  if (themeMode === 'system') {
    activeTheme = systemColorScheme === 'dark' ? darkTheme : lightTheme;
  } else {
    activeTheme = themeMode === 'dark' ? darkTheme : lightTheme;
  }

  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, themeMode, updateThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
