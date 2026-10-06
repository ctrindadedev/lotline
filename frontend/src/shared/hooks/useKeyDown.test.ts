import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { isTyping, useKeyDown } from './useKeyDown';

describe('useKeyDown', () => {
  it('hears keys pressed anywhere on the page while mounted', () => {
    const onKeyDown = vi.fn<(event: KeyboardEvent) => void>();
    const { unmount } = renderHook(() => useKeyDown(onKeyDown));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    unmount();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(onKeyDown.mock.calls[0][0].key).toBe('Escape');
  });
});

describe('isTyping', () => {
  it('is true in fields and false elsewhere', () => {
    const editable = document.createElement('div');
    editable.contentEditable = 'true';

    expect(isTyping(document.createElement('input'))).toBe(true);
    expect(isTyping(document.createElement('textarea'))).toBe(true);
    expect(isTyping(document.createElement('div'))).toBe(false);
    expect(isTyping(window)).toBe(false);
    expect(isTyping(null)).toBe(false);
  });
});
