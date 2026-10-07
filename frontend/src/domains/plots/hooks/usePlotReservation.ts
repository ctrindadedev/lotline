import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCurrentUser, useForgetUser, type AuthRedirect } from '../../auth';
import { messages } from '../../../shared/i18n/messages';
import { ApiError } from '../../../shared/lib/http';
import { releaseReservation, reservePlot, sellPlot } from '../services/plots.api';
import type { PlotFeature } from '../types';
import {
  describeReservationError,
  reservationActions,
  type ReservationAction,
} from '../utils/reservation';
import { plotKeys } from './usePlotsInView';

const text = messages.reservation;
const RESERVE_PLOT: AuthRedirect = { from: '/', reason: 'reservePlot' };

const perform: Record<ReservationAction, (id: string) => Promise<PlotFeature>> = {
  reserve: reservePlot,
  cancel: releaseReservation,
  release: releaseReservation,
  sell: sellPlot,
};

/** Reserving, releasing and selling the plot whose details are open (ADR 0021). */
export function usePlotReservation(plot: PlotFeature | null) {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const forgetUser = useForgetUser();
  const [saleOf, setSaleOf] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ action, id }: { action: ReservationAction; id: string }) => perform[action](id),
    onSuccess: (_, { action }) => {
      setNotice(text.done[action]);
      return queryClient.invalidateQueries({ queryKey: plotKeys.all });
    },
    onError: (error) => {
      setNotice(describeReservationError(error));
      if (error instanceof ApiError && error.status === 401) {
        forgetUser();
      } else {
        return queryClient.invalidateQueries({ queryKey: plotKeys.all });
      }
    },
    onSettled: () => setSaleOf(null),
  });

  function run(action: ReservationAction) {
    if (!plot) {
      return;
    }
    if (!user) {
      navigate('/login', { state: RESERVE_PLOT });
    } else if (action === 'sell') {
      setSaleOf(plot.id);
    } else {
      mutation.mutate({ action, id: plot.id });
    }
  }

  return {
    actions: (plot ? reservationActions(plot.properties) : []).map((action) => ({
      action,
      label: text.actions[action],
      run: () => run(action),
    })),
    isBusy: mutation.isPending,
    sale: {
      open: saleOf !== null,
      isSelling: mutation.isPending,
      confirm: () => saleOf && mutation.mutate({ action: 'sell', id: saleOf }),
      close: () => setSaleOf(null),
    },
    notice,
    dismissNotice: () => setNotice(null),
  };
}
