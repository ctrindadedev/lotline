import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { messages } from '../shared/i18n/messages';
import { ErrorBoundary } from './ErrorBoundary';

function Broken(): never {
  throw new Error('render failed');
}

describe('ErrorBoundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders its children while nothing fails', () => {
    render(
      <ErrorBoundary>
        <p>map</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('map')).toBeInTheDocument();
  });

  it('shows a message with a reload button instead of a blank page', async () => {
    // React logs the caught error; keep the test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onReload = vi.fn<() => void>();
    render(
      <ErrorBoundary onReload={onReload}>
        <Broken />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(messages.crash.title);
    await userEvent.click(screen.getByRole('button', { name: messages.crash.reload }));

    expect(onReload).toHaveBeenCalledOnce();
  });
});
