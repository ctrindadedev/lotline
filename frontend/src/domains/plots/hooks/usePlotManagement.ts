import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useForgetUser } from '../../auth';
import { messages } from '../../../shared/i18n/messages';
import { ApiError } from '../../../shared/lib/http';
import { deletePlot, updatePlot } from '../services/plots.api';
import type { PlotFeature } from '../types';
import { describeManageError } from '../utils/manageErrors';
import {
  EMPTY_PLOT_FORM,
  plotFormResolver,
  toPlotFields,
  type PlotFormValues,
} from '../utils/plotForm';
import { plotKeys } from './usePlotsInView';

type Dialog = { kind: 'edit' | 'delete'; plotId: string } | null;

/** Editing and deleting the plot whose details are open, for its owner. */
export function usePlotManagement(plot: PlotFeature | null) {
  const queryClient = useQueryClient();
  const forgetUser = useForgetUser();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<PlotFormValues>({
    defaultValues: EMPTY_PLOT_FORM,
    resolver: plotFormResolver,
  });

  function done(message: string) {
    setDialog(null);
    setNotice(message);
    return queryClient.invalidateQueries({ queryKey: plotKeys.all });
  }

  function onError(error: Error) {
    if (error instanceof ApiError && error.status === 401) {
      forgetUser();
    }
  }

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: PlotFormValues }) =>
      updatePlot(id, toPlotFields(values)),
    onSuccess: () => done(messages.manage.saved),
    onError,
  });
  const remove = useMutation({
    mutationFn: deletePlot,
    onSuccess: () => done(messages.manage.deleted),
    onError,
  });

  function startEdit() {
    if (!plot) {
      return;
    }
    const { price, description, contact } = plot.properties;
    form.reset({ price: String(price).replace('.', ','), description, contact });
    update.reset();
    setDialog({ kind: 'edit', plotId: plot.id });
  }

  function startDelete() {
    if (plot) {
      remove.reset();
      setDialog({ kind: 'delete', plotId: plot.id });
    }
  }

  const close = () => setDialog(null);
  const target = dialog?.plotId ?? '';

  return {
    canManage: plot?.properties.ownedByMe ?? false,
    startEdit,
    startDelete,
    edit: {
      open: dialog?.kind === 'edit',
      form,
      alert: describeManageError(update.error),
      isSaving: update.isPending,
      submit: form.handleSubmit((values) => update.mutate({ id: target, values })),
      close,
    },
    remove: {
      open: dialog?.kind === 'delete',
      alert: describeManageError(remove.error),
      isDeleting: remove.isPending,
      confirm: () => remove.mutate(target),
      close,
    },
    notice,
    dismissNotice: () => setNotice(null),
  };
}
