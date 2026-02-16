import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#E91E8C',
      light: '#FFC0CB',
      dark: '#C2185B',
    },
    secondary: {
      main: '#4A0E4E',
    },
    background: {
      default: '#FFFFFF',
    },
    text: {
      primary: '#000000',
      secondary: '#4A0E4E',
    },
  },
  typography: {
    fontFamily: '"Georgia", "Times New Roman", serif',
    h1: {
      fontFamily: '"Georgia", serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Georgia", serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Georgia", serif',
      fontWeight: 700,
    },
    h4: {
      fontFamily: '"Georgia", serif',
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
    },
  },
});

export default theme;
