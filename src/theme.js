import { createTheme } from '@mui/material/styles';

export function createAppTheme(mode) {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#E91E8C',
        light: '#FFC0CB',
        dark: '#C2185B',
      },
      secondary: {
        main: isDark ? '#ce93d8' : '#4A0E4E',
      },
      background: {
        default: isDark ? '#0f0118' : '#ffffff',
        paper:   isDark ? '#1c0530' : '#ffffff',
      },
      text: {
        primary:   isDark ? '#f5e6f5' : '#000000',
        secondary: isDark ? '#ce93d8' : '#4A0E4E',
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
