import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPlot } from '../services/plots.api';
import { plotKeys } from './usePlotsInView';

interface CreatePlotCallbacks {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/** Callbacks live on the mutation, not on `mutate`, so they still run after a reset. */
export function useCreatePlot({ onSuccess, onError }: CreatePlotCallbacks = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlot,
    onSuccess: () => {
      onSuccess?.();
      return queryClient.invalidateQueries({ queryKey: plotKeys.all });
    },
    onError,
  });
}
