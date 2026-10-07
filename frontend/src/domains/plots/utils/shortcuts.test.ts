import { describe, expect, it } from 'vitest';
import type { InteractionMode } from './interactionMode';
import { shortcutFor, type KeyPress, type ShortcutAction } from './shortcuts';

const ESC: KeyPress = {
  key: 'Escape',
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  typing: false,
};
const CTRL_Z: KeyPress = {
  key: 'z',
  ctrlKey: true,
  metaKey: false,
  shiftKey: false,
  typing: false,
};
const CMD_Z: KeyPress = { key: 'Z', ctrlKey: false, metaKey: true, shiftKey: false, typing: false };
const BACKSPACE: KeyPress = {
  key: 'Backspace',
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  typing: false,
};
const PLAIN_Z: KeyPress = {
  key: 'z',
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  typing: false,
};

describe('shortcutFor', () => {
  it.each<[string, KeyPress, InteractionMode, boolean, ShortcutAction | null]>([
    ['Esc cancels a plot drawing', ESC, 'drawingPlot', false, 'cancel'],
    ['Esc cancels a circle drawing', ESC, 'drawingSearch', false, 'cancel'],
    ['Esc leaves a search', ESC, 'searching', false, 'cancel'],
    ['Esc closes a result before leaving the search', ESC, 'searching', true, 'closeDetails'],
    ['Esc closes the plot details', ESC, 'idle', true, 'closeDetails'],
    ['Esc does nothing when idle', ESC, 'idle', false, null],
    ['Esc keeps a plot whose form is open', ESC, 'editingPlot', false, null],
    ['Ctrl+Z removes the last corner', CTRL_Z, 'drawingPlot', false, 'undoLastPoint'],
    ['Cmd+Z removes the last corner', CMD_Z, 'drawingPlot', false, 'undoLastPoint'],
    ['Backspace removes the last corner', BACKSPACE, 'drawingPlot', false, 'undoLastPoint'],
    ['Z alone does nothing', PLAIN_Z, 'drawingPlot', false, null],
    [
      'Ctrl+Shift+Z (redo) does not undo',
      { ...CTRL_Z, key: 'Z', shiftKey: true },
      'drawingPlot',
      false,
      null,
    ],
    ['Cmd+Shift+Z (redo) does not undo', { ...CMD_Z, shiftKey: true }, 'drawingPlot', false, null],
    ['Ctrl+Z does nothing outside a plot drawing', CTRL_Z, 'drawingSearch', false, null],
    ['Backspace does nothing when idle', BACKSPACE, 'idle', false, null],
  ])('%s', (_, key, mode, detailsOpen, expected) => {
    expect(shortcutFor(key, mode, detailsOpen)).toBe(expected);
  });

  it('ignores every key while the user types in a field', () => {
    for (const key of [ESC, CTRL_Z, BACKSPACE]) {
      expect(shortcutFor({ ...key, typing: true }, 'drawingPlot', true)).toBeNull();
    }
  });
});
