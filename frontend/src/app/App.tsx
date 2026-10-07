import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { LoginPage, RegisterPage } from '../domains/auth';
import { MapPage } from '../domains/plots';
import { ErrorBoundary } from './ErrorBoundary';
import { Layout } from './Layout';
import { Providers } from './providers';

export function App() {
  return (
    <Providers>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Providers>
  );
}

export function AppRoutes() {
  return (
    <Layout>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}
