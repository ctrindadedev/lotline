import type VectorSource from 'ol/source/Vector';
import { useEffect } from 'react';

export const SELECTED = 'selected';

/**
 * Flags the feature with this id as `selected` (a feature property a style can read), and
 * re-flags it whenever the source's contents change.
 */
export function useSelectedFeature(source: VectorSource, id: string | null, contents: unknown) {
  useEffect(() => {
    for (const feature of source.getFeatures()) {
      feature.set(SELECTED, feature.getId() === id);
    }
  }, [source, id, contents]);
}
