import { useEffect, useEffectEvent } from 'react';

/** Listens to key presses on the whole page while mounted. */
export function useKeyDown(onKeyDown: (event: KeyboardEvent) => void) {
  const handle = useEffectEvent(onKeyDown);

  useEffect(() => {
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
}

/** True while the user types in a field, where keys belong to the field, not to shortcuts. */
export function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}
