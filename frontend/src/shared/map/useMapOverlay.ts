import type OlMap from 'ol/Map';
import Overlay from 'ol/Overlay';
import type { Coordinate } from 'ol/coordinate';
import { useEffect, useRef, useState } from 'react';

/**
 * An element pinned to a map coordinate. OpenLayers moves it in the DOM, so React must not own
 * it: render into it with `createPortal`.
 */
export function useMapOverlay(map: OlMap | null, position: Coordinate | null): HTMLElement {
  const [element] = useState(() => document.createElement('div'));
  const overlayRef = useRef<Overlay | null>(null);
  const positionRef = useRef(position);

  useEffect(() => {
    positionRef.current = position;
    overlayRef.current?.setPosition(position ?? undefined);
  }, [position]);

  // Created in the effect, not in a state initializer: StrictMode runs initializers twice, and
  // the second Overlay would take the element away from the first.
  useEffect(() => {
    if (!map) {
      return;
    }
    const overlay = new Overlay({
      element,
      positioning: 'bottom-center',
      offset: [0, -12],
      autoPan: { animation: { duration: 250 } },
    });
    overlay.setPosition(positionRef.current ?? undefined);
    map.addOverlay(overlay);
    overlayRef.current = overlay;
    return () => {
      map.removeOverlay(overlay);
      overlayRef.current = null;
    };
  }, [map, element]);

  return element;
}
