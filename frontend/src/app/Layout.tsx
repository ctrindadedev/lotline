import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { AccountMenu } from '../domains/auth';
import styles from './Layout.module.css';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar variant="dense">
          <Typography
            variant="h6"
            component="h1"
            sx={{ flexGrow: 1, '& a': { color: 'inherit', textDecoration: 'none' } }}
          >
            <RouterLink to="/">Lotline</RouterLink>
          </Typography>
          <AccountMenu />
        </Toolbar>
      </AppBar>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
