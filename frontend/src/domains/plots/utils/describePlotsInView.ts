import type { PlotsInView } from '../hooks/usePlotsInView';

export function describePlotsInView({
  mapReady,
  zoomedIn,
  plots,
  isLoading,
  error,
}: PlotsInView): string {
  if (!mapReady) {
    return 'Loading the map…';
  }
  if (!zoomedIn) {
    return 'Zoom in to see the plots in this area.';
  }
  if (error) {
    return `Could not load plots: ${error.message}`;
  }
  if (isLoading || !plots) {
    return 'Loading plots…';
  }
  const count = plots.features.length;
  if (count === 0) {
    return 'No plots in this area yet.';
  }
  return count === 1 ? '1 plot in this area.' : `${count} plots in this area.`;
}
