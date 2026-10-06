import { MapPage } from '../domains/plots';
import { Layout } from './Layout';
import { Providers } from './providers';

export function App() {
  return (
    <Providers>
      <Layout>
        <MapPage />
      </Layout>
    </Providers>
  );
}
