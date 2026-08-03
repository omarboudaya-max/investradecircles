const common = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 14,
    lg: 20,
    full: 9999,
  }
};

export const lightTheme = {
  ...common,
  dark: false,
  colors: {
    background: 'hsl(210, 40%, 98%)',
    foreground: 'hsl(215, 25%, 12%)',
    card: 'hsl(0, 0%, 100%)',
    cardForeground: 'hsl(215, 25%, 12%)',
    primary: 'hsl(182, 90%, 42%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    border: 'hsl(210, 20%, 90%)',
    muted: 'hsl(210, 20%, 96%)',
    mutedForeground: 'hsl(215, 15%, 50%)',
    error: '#ef4444',
    success: '#10b981',
  },
};

export const darkTheme = {
  ...common,
  dark: true,
  colors: {
    background: 'hsl(215, 30%, 8%)',
    foreground: 'hsl(210, 20%, 95%)',
    card: 'hsl(215, 25%, 12%)',
    cardForeground: 'hsl(210, 20%, 95%)',
    primary: 'hsl(211, 80%, 55%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    border: 'hsl(215, 20%, 20%)',
    muted: 'hsl(215, 20%, 16%)',
    mutedForeground: 'hsl(210, 15%, 55%)',
    error: '#ef4444',
    success: '#10b981',
    // Fallbacks for older files not yet refactored
    backgroundDark: 'hsl(215, 30%, 8%)',
    cardDark: 'hsl(215, 25%, 12%)',
    borderDark: 'hsl(215, 20%, 20%)',
    primaryLight: 'hsl(211, 80%, 55%)'
  },
};

export const theme = darkTheme;
