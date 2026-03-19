import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from '../theme';

const ThemeCtx = createContext({ mode: 'light', toggleMode: () => {} });

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('colorMode') || 'light'; } catch { return 'light'; }
  });

  useEffect(() => {
    try { localStorage.setItem('colorMode', mode); } catch { /* ignore */ }
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleMode = () => setMode(m => m === 'light' ? 'dark' : 'light');
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeCtx.Provider value={{ mode, toggleMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeCtx.Provider>
  );
}

export const useThemeMode = () => useContext(ThemeCtx);
