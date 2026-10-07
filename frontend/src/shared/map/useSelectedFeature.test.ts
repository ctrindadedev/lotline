import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SELECTED, useSelectedFeature } from './useSelectedFeature';

function feature(id: string) {
  const created = new Feature();
  created.setId(id);
  return created;
}

describe('useSelectedFeature', () => {
  it('flags only the selected feature, again when the contents change', () => {
    const source = new VectorSource({ features: [feature('a'), feature('b')] });
    const { rerender } = renderHook(
      ({ id, contents }) => useSelectedFeature(source, id, contents),
      {
        initialProps: { id: 'a' as string | null, contents: 1 },
      },
    );
    const flags = () => source.getFeatures().map((f) => [f.getId(), f.get(SELECTED)]);

    expect(flags()).toEqual([
      ['a', true],
      ['b', false],
    ]);

    source.clear();
    source.addFeatures([feature('a'), feature('c')]);
    rerender({ id: 'a', contents: 2 });
    expect(flags()).toEqual([
      ['a', true],
      ['c', false],
    ]);

    rerender({ id: null, contents: 2 });
    expect(flags()).toEqual([
      ['a', false],
      ['c', false],
    ]);
  });
});
