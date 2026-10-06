import type { InteractionMode } from './interactionMode';

export type ShortcutAction = 'cancel' | 'undoLastPoint' | 'closeDetails';

export interface KeyPress {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  typing: boolean;
}

/**
 * Esc leaves a drawing or a search, or closes the plot details; Ctrl/Cmd+Z (not the Shift redo) or Backspace removes
 * the last corner of a plot being drawn. Nothing while typing, and Esc never discards a plot whose
 * form is open: the form has its own buttons for that.
 */
export function shortcutFor(
  { key, ctrlKey, metaKey, shiftKey, typing }: KeyPress,
  mode: InteractionMode,
  detailsOpen: boolean,
): ShortcutAction | null {
  if (typing) {
    return null;
  }
  if (key === 'Escape') {
    if (mode === 'drawingPlot' || mode === 'drawingSearch' || mode === 'searching') {
      return 'cancel';
    }
    return detailsOpen ? 'closeDetails' : null;
  }
  const undo =
    key === 'Backspace' || ((ctrlKey || metaKey) && !shiftKey && key.toLowerCase() === 'z');
  return undo && mode === 'drawingPlot' ? 'undoLastPoint' : null;
}
