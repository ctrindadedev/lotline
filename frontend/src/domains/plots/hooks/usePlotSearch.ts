import { skipToken, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { formatDistance } from '../../../shared/i18n/format';
import { geodesicCircle } from '../../../shared/map/geodesy';
import { polygonCollection } from '../../../shared/map/geojson';
import { searchPlots } from '../services/plots.api';
import type { RadiusSearch } from '../types';
import { describeSearch } from '../utils/describeSearch';
import {
  EMPTY_SEARCH_FILTERS,
  searchFiltersResolver,
  toSearchFilters,
  type SearchFilterValues,
  type SearchFilters,
} from '../utils/searchFilters';
import type { useInteractionMode } from './useInteractionMode';
import { plotKeys } from './usePlotsInView';

export const MAX_SEARCH_RADIUS_METERS = 50_000;

type Interaction = ReturnType<typeof useInteractionMode>;

/** Everything about searching by circle: the area on the map, the filters and the results. */
export function usePlotSearch(interaction: Interaction) {
  const form = useForm<SearchFilterValues>({
    defaultValues: EMPTY_SEARCH_FILTERS,
    resolver: searchFiltersResolver,
  });
  const [filters, setFilters] = useState<SearchFilters>({});

  const { state } = interaction;
  const drawn = state.mode === 'searching' ? state.area : null;
  const area = useMemo(
    () =>
      drawn && {
        center: drawn.center,
        radiusMeters: Math.min(drawn.radiusMeters, MAX_SEARCH_RADIUS_METERS),
      },
    [drawn],
  );
  const circle = useMemo(
    () => (area ? polygonCollection('search-area', geodesicCircle(area)) : undefined),
    [area],
  );

  const params: RadiusSearch | null = area && {
    lng: area.center[0],
    lat: area.center[1],
    radiusMeters: area.radiusMeters,
    ...filters,
  };
  const query = useQuery({
    queryKey: plotKeys.search(params),
    queryFn: params ? ({ signal }) => searchPlots(params, signal) : skipToken,
  });

  const applyFilters = form.handleSubmit((values) => setFilters(toSearchFilters(values)));

  function clearFilters() {
    form.reset(EMPTY_SEARCH_FILTERS);
    setFilters({});
  }

  return {
    circle,
    results: area ? query.data : undefined,
    panel: area
      ? {
          form,
          radius: formatDistance(area.radiusMeters),
          capped: drawn!.radiusMeters > MAX_SEARCH_RADIUS_METERS,
          status: describeSearch({
            results: query.data,
            isLoading: query.isPending,
            error: query.error,
          }),
          applyFilters,
          clearFilters,
        }
      : null,
  };
}
