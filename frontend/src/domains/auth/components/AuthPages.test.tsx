import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { messages } from '../../../shared/i18n/messages';
import { createTestQueryClient } from '../../../test/queryClient';
import { AccountMenu } from './AccountMenu';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';

const text = messages.auth;
const ANA = { id: 'u1', name: 'Ana', email: 'ana@example.com' };

function problem(status: number, body: object = {}) {
  return Response.json(
    { title: 'Error', detail: 'x', ...body },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

function MapStub() {
  return (
    <>
      <p>map</p>
      <p data-testid="search">{useLocation().search}</p>
    </>
  );
}

function renderAt(path: string, state?: object) {
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[{ pathname: path, state }]}>
        <AccountMenu />
        <Routes>
          <Route path="/" element={<MapStub />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const field = (name: string) => screen.getByLabelText(new RegExp(name));

describe('login and registration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs in and goes back to the map, greeting the user', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (url) =>
        String(url).endsWith('/auth/me') && fetchMock.mock.calls.length === 1
          ? problem(401)
          : Response.json(ANA),
      );
    renderAt('/login', { from: '/', reason: 'listPlot' });

    expect(screen.getByText(text.logIn.reasons.listPlot)).toBeInTheDocument();
    await userEvent.type(field(text.fields.email), 'ana@example.com');
    await userEvent.type(field(text.fields.password), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: text.logIn.submit }));

    await waitFor(() => expect(screen.getByText('map')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: text.menu.open }));
    expect(screen.getByText(text.menu.greeting('Ana'))).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('menuitem', { name: text.menu.myListings }));
    expect(screen.getByTestId('search')).toHaveTextContent('?panel=mine');
    await userEvent.click(screen.getByRole('button', { name: text.menu.open }));
    await userEvent.click(screen.getByRole('menuitem', { name: text.menu.myReservations }));
    expect(screen.getByTestId('search')).toHaveTextContent('?panel=reserved');
  });

  it('says when the email or the password is wrong', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => problem(401));
    renderAt('/login');

    await userEvent.type(field(text.fields.email), 'ana@example.com');
    await userEvent.type(field(text.fields.password), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: text.logIn.submit }));

    expect(await screen.findByText(text.errors.badCredentials)).toBeInTheDocument();
  });

  it('answers a field the API rejects on login with the same generic message', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
      String(url).endsWith('/auth/me')
        ? problem(401)
        : problem(400, { errors: [{ field: 'email', message: 'must be a well-formed email' }] }),
    );
    renderAt('/login');

    await userEvent.type(field(text.fields.email), 'ana@example.com');
    await userEvent.type(field(text.fields.password), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: text.logIn.submit }));

    expect(await screen.findByText(text.errors.badCredentials)).toBeInTheDocument();
    expect(screen.queryByText(text.errors.emailInvalid)).not.toBeInTheDocument();
  });

  it('answers an incomplete login form with the generic message, without asking the API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => problem(401));
    renderAt('/login');

    await userEvent.type(field(text.fields.email), 'not-an-email');
    await userEvent.tab();
    expect(screen.queryByText(text.errors.badCredentials)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: text.logIn.submit }));

    expect(screen.getByText(text.errors.badCredentials)).toBeInTheDocument();
    expect(screen.queryByText(text.errors.emailInvalid)).not.toBeInTheDocument();
    expect(screen.queryByText(text.errors.passwordRequired)).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([url]) => String(url).endsWith('/auth/me'))).toBe(true);
  });

  it('checks the form before sending it', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => problem(401));
    renderAt('/register');

    await userEvent.click(screen.getByRole('button', { name: text.register.submit }));

    expect(screen.getByText(text.errors.nameRequired)).toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([url]) => String(url).endsWith('/auth/me'))).toBe(true);
  });

  it('registers, and says only that a taken email could not be used', async () => {
    let taken = true;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).endsWith('/auth/me')) return problem(401);
      if (taken) {
        taken = false;
        return problem(409);
      }
      return Response.json(ANA, { status: 201 });
    });
    renderAt('/register');

    await userEvent.type(field(text.fields.name), 'Ana');
    await userEvent.type(field(text.fields.email), 'ana@example.com');
    await userEvent.type(field(text.fields.password), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: text.register.submit }));
    expect(await screen.findByText(text.errors.registrationFailed)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: text.register.submit }));
    await waitFor(() => expect(screen.getByText('map')).toBeInTheDocument());
  });

  it('links the two pages and logs out from the menu', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (_url, init) =>
        init?.method === 'POST' ? new Response(null, { status: 204 }) : Response.json(ANA),
      );
    renderAt('/login');

    await userEvent.click(screen.getByRole('link', { name: text.menu.register }));
    expect(screen.getByRole('button', { name: text.register.submit })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: text.menu.logIn }));
    expect(screen.getByRole('button', { name: text.logIn.submit })).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: text.menu.open }));
    await userEvent.click(screen.getByRole('menuitem', { name: text.menu.logOut }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/auth/logout'))).toBe(true),
    );
  });

  it('checks the registration only when it is sent', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => problem(401));
    renderAt('/register');
    const email = field(text.fields.email);

    await userEvent.type(email, 'ana@');
    await userEvent.tab();
    expect(screen.queryByText(text.errors.emailInvalid)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: text.register.submit }));
    expect(await screen.findByText(text.errors.emailInvalid)).toBeInTheDocument();

    // Corrected but not sent again: the message stays until the next submit.
    await userEvent.type(email, 'example.com');
    expect(screen.getByText(text.errors.emailInvalid)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: text.register.submit }));
    await waitFor(() =>
      expect(screen.queryByText(text.errors.emailInvalid)).not.toBeInTheDocument(),
    );
  });

  it('refuses a password of spaces before asking the API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    renderAt('/register');

    await userEvent.type(field(text.fields.name), 'Ana');
    await userEvent.type(field(text.fields.email), 'ana@example.com');
    await userEvent.type(field(text.fields.password), '        ');
    await userEvent.click(screen.getByRole('button', { name: text.register.submit }));

    expect(await screen.findByText(text.errors.passwordRequired)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/register'))).toBe(false);
  });

  it('shows and hides the password', async () => {
    renderAt('/login');
    const password = field(text.fields.password);
    expect(password).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: text.fields.showPassword }));
    expect(password).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: text.fields.hidePassword }));
    expect(password).toHaveAttribute('type', 'password');
  });
});
