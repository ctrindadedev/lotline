import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';
import type { MapViewport } from '../../../shared/map/useMapViewport';
import { listPlotsInBoundingBox } from '../services/plots.api';

export const MIN_PLOTS_ZOOM = 12;

export const plotKeys = {
  all: ['plots'] as const,
  inBoundingBox: (bbox: readonly number[] | undefined) => ['plots', 'bbox', bbox] as const,
};

export function usePlotsInView(viewport: MapViewport | null) {
  const zoomedIn = viewport !== null && viewport.zoom >= MIN_PLOTS_ZOOM;
  const bbox = zoomedIn ? viewport.bbox : undefined;

  const query = useQuery({
    queryKey: plotKeys.inBoundingBox(bbox),
    queryFn: bbox ? ({ signal }) => listPlotsInBoundingBox(bbox, signal) : skipToken,
    placeholderData: keepPreviousData,
  });

  return {
    mapReady: viewport !== null,
    zoomedIn,
    plots: zoomedIn ? query.data : undefined,
    isLoading: zoomedIn && query.isPending,
    error: zoomedIn ? query.error : null,
  };
}

export type PlotsInView = ReturnType<typeof usePlotsInView>;
