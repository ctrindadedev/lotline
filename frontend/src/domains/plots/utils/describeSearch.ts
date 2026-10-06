import { messages } from '../../../shared/i18n/messages';
import type { PlotFeatureCollection } from '../types';

const text = messages.search;

interface SearchState {
  results: PlotFeatureCollection | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function describeSearch({ results, isLoading, error }: SearchState): string {
  if (error) {
    return text.failed;
  }
  if (isLoading || !results) {
    return text.searching;
  }
  const count = results.features.length;
  return count === 0 ? text.none : text.count(count);
}
