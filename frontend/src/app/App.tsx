import styles from './App.module.css';
import { Providers } from './providers';

export function App() {
  return (
    <Providers>
      <main className={styles.app}>
        <h1 className={styles.title}>Lotline</h1>
      </main>
    </Providers>
  );
}
