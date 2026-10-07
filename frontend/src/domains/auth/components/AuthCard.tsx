import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  notice?: string;
  error: string | null;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthCard({ title, notice, error, footer, children }: AuthCardProps) {
  return (
    <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 380, p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5" component="h2">
            {title}
          </Typography>
          {notice && <Alert severity="info">{notice}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          {children}
          <Typography variant="body2">{footer}</Typography>
        </Stack>
      </Paper>
    </Stack>
  );
}
