import { skipToken, useQuery } from '@tanstack/react-query';
import { listMyPlots } from '../services/plots.api';
import { plotKeys } from './usePlotsInView';

/** The logged-in user's listings and reservations; nothing for a visitor. */
export function useMyPlots(userId: string | null) {
  const query = useQuery({
    // Keyed by user: after switching accounts, the previous user's plots are never shown.
    queryKey: plotKeys.mine(userId),
    queryFn: userId ? ({ signal }) => listMyPlots(signal) : skipToken,
  });
  const plots = userId ? (query.data?.features ?? []) : [];
  return {
    plots,
    listed: plots.filter((plot) => plot.properties.ownedByMe),
    reserved: plots.filter((plot) => plot.properties.reservedByMe),
    isLoading: userId !== null && query.isPending,
    error: userId ? query.error : null,
  };
}
