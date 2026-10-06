import { describe, expect, it } from 'vitest';
import type { PlotFeature } from '../types';
import { describeSearch } from './describeSearch';

function results(count: number) {
  const features = Array.from({ length: count }, () => ({}) as PlotFeature);
  return { type: 'FeatureCollection' as const, features };
}

describe('describeSearch', () => {
  it.each([
    ['loading', { results: undefined, isLoading: true, error: null }, 'Searching…'],
    [
      'failed',
      { results: undefined, isLoading: false, error: new Error('boom') },
      'Could not search: boom',
    ],
    [
      'empty',
      { results: results(0), isLoading: false, error: null },
      'No plots reach into this circle.',
    ],
    [
      'one',
      { results: results(1), isLoading: false, error: null },
      '1 plot reaches into this circle.',
    ],
    [
      'many',
      { results: results(4), isLoading: false, error: null },
      '4 plots reach into this circle.',
    ],
  ])('describes a %s search', (_, state, message) => {
    expect(describeSearch(state)).toBe(message);
  });
});
