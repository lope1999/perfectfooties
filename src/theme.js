import { createTheme } from '@mui/material/styles';

export function createAppTheme(mode) {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main:  '#e3242b',
        light: '#f0898c',
        dark:  '#b81b21',
      },
      secondary: {
        main: isDark ? '#00cccc' : '#006666',
      },
      background: {
        default: isDark ? '#0a0000' : '#ffffff',
        paper:   isDark ? '#120404' : '#ffffff',
      },
      text: {
        primary:   isDark ? '#f5f0f0' : '#1A1A1A',
        secondary: isDark ? '#00cccc' : '#006666',
      },
      divider: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    },
    typography: {
      fontFamily: '"Georgia", "Times New Roman", serif',
      h1: { fontFamily: '"Georgia", serif', fontWeight: 700 },
      h2: { fontFamily: '"Georgia", serif', fontWeight: 700 },
      h3: { fontFamily: '"Georgia", serif', fontWeight: 700 },
      h4: { fontFamily: '"Georgia", serif', fontWeight: 700 },
      button: { textTransform: 'none' },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
}

// Backward-compatible default export (light theme)
export default createAppTheme('light');
