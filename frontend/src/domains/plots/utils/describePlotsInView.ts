import { messages } from '../../../shared/i18n/messages';
import type { PlotsInView } from '../hooks/usePlotsInView';

const text = messages.plotsInView;

export function describePlotsInView({
  mapReady,
  zoomedIn,
  plots,
  isLoading,
  error,
}: PlotsInView): string {
  if (!mapReady) {
    return text.mapLoading;
  }
  if (!zoomedIn) {
    return text.zoomIn;
  }
  if (error) {
    return text.failed;
  }
  if (isLoading || !plots) {
    return text.loading;
  }
  const count = plots.features.length;
  return count === 0 ? text.none : text.count(count);
}
