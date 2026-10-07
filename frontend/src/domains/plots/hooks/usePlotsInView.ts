import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';
import type { MapViewport } from '../../../shared/map/useMapViewport';
import { listPlotsInBoundingBox, summarizePlotsInBoundingBox } from '../services/plots.api';

export const MIN_PLOTS_ZOOM = 12;

export const plotKeys = {
  all: ['plots'] as const,
  inBoundingBox: (bbox: readonly number[] | undefined) => ['plots', 'bbox', bbox] as const,
  search: (search: object | null) => ['plots', 'search', search] as const,
  summary: (bbox: readonly number[] | undefined) => ['plots', 'summary', bbox] as const,
  mine: (userId: string | null) => ['plots', 'mine', userId] as const,
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

/** The figures of the plots in view, kept on screen while the next viewport's load. */
export function usePlotsSummary(viewport: MapViewport | null) {
  const zoomedIn = viewport !== null && viewport.zoom >= MIN_PLOTS_ZOOM;
  const bbox = zoomedIn ? viewport.bbox : undefined;
  const query = useQuery({
    queryKey: plotKeys.summary(bbox),
    queryFn: bbox ? ({ signal }) => summarizePlotsInBoundingBox(bbox, signal) : skipToken,
    placeholderData: keepPreviousData,
  });
  return zoomedIn ? (query.data ?? null) : null;
}
