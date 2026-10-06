import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { InteractionMode } from '../utils/interactionMode';
import { MapToolbar } from './MapToolbar';

function renderToolbar(mode: InteractionMode, disabled = false) {
  const handlers = {
    onDrawPlot: vi.fn<() => void>(),
    onDrawSearch: vi.fn<() => void>(),
    onCancel: vi.fn<() => void>(),
  };
  render(<MapToolbar mode={mode} disabled={disabled} {...handlers} />);
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

  it('can be disabled while a plot is being saved', () => {
    renderToolbar('editingPlot', true);

    expect(screen.getByRole('button', { name: 'Editing plot' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Search an area' })).toBeDisabled();
  });

  it('shows the plot being edited as pressed, and ignores a click on it', async () => {
    const handlers = renderToolbar('editingPlot');
    const editing = screen.getByRole('button', { name: 'Editing plot' });

    expect(editing).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(editing);

    expect(handlers.onCancel).not.toHaveBeenCalled();
    expect(handlers.onDrawPlot).not.toHaveBeenCalled();
  });

  it('still switches to search while a plot is edited', async () => {
    const handlers = renderToolbar('editingPlot');

    await userEvent.click(screen.getByRole('button', { name: 'Search an area' }));

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
