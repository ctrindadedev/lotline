import { ptBR } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';

export const theme = createTheme(
  {
    palette: {
      primary: { main: '#1f6feb' },
    },
    typography: {
      fontFamily: 'system-ui, sans-serif',
    },
  },
  ptBR,
);
