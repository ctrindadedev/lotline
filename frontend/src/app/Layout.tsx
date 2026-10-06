import type { ReactNode } from 'react';
import styles from './Layout.module.css';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.title}>Lotline</h1>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
