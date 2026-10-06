import { describe, expect, it } from 'vitest';
import type { PlotFeature } from '../types';
import { describeSearch } from './describeSearch';
import { messages } from '../../../shared/i18n/messages';

function results(count: number) {
  const features = Array.from({ length: count }, () => ({}) as PlotFeature);
  return { type: 'FeatureCollection' as const, features };
}

describe('describeSearch', () => {
  it.each([
    ['loading', { results: undefined, isLoading: true, error: null }, messages.search.searching],
    [
      'failed',
      { results: undefined, isLoading: false, error: new Error('boom') },
      messages.search.failed,
    ],
    ['empty', { results: results(0), isLoading: false, error: null }, messages.search.none],
    ['one', { results: results(1), isLoading: false, error: null }, messages.search.count(1)],
    ['many', { results: results(4), isLoading: false, error: null }, messages.search.count(4)],
  ])('describes a %s search', (_, state, message) => {
    expect(describeSearch(state)).toBe(message);
  });
});
