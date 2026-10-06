import type { PlotFeatureCollection } from '../types';

interface SearchState {
  results: PlotFeatureCollection | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function describeSearch({ results, isLoading, error }: SearchState): string {
  if (error) {
    return `Could not search: ${error.message}`;
  }
  if (isLoading || !results) {
    return 'Searching…';
  }
  const count = results.features.length;
  if (count === 0) {
    return 'No plots reach into this circle.';
  }
  return count === 1
    ? '1 plot reaches into this circle.'
    : `${count} plots reach into this circle.`;
}
