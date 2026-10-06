import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { InteractionMode } from '../utils/interactionMode';
import { MapToolbar } from './MapToolbar';

function renderToolbar(mode: InteractionMode) {
  const handlers = {
    onDrawPlot: vi.fn<() => void>(),
    onDrawSearch: vi.fn<() => void>(),
    onCancel: vi.fn<() => void>(),
  };
  render(<MapToolbar mode={mode} {...handlers} />);
  return handlers;
}

describe('MapToolbar', () => {
  it('starts drawing a plot or a search area', async () => {
    const handlers = renderToolbar('idle');

    await userEvent.click(screen.getByRole('button', { name: 'List a plot' }));
    await userEvent.click(screen.getByRole('button', { name: 'Search an area' }));

    expect(handlers.onDrawPlot).toHaveBeenCalledOnce();
    expect(handlers.onDrawSearch).toHaveBeenCalledOnce();
  });

  it('shows the active mode as pressed and cancels it when clicked again', async () => {
    const handlers = renderToolbar('drawingPlot');
    const listPlot = screen.getByRole('button', { name: 'List a plot' });

    expect(listPlot).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Search an area' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await userEvent.click(listPlot);
    expect(handlers.onCancel).toHaveBeenCalledOnce();
  });
});
