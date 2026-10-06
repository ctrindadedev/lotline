import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { polygonCollection } from '../../../shared/map/geojson';
import {
  describeSaveError,
  EMPTY_PLOT_FORM,
  plotFormResolver,
  toPlotFields,
  type PlotFormField,
  type PlotFormValues,
} from '../utils/plotForm';
import { useCreatePlot } from './useCreatePlot';
import type { useInteractionMode } from './useInteractionMode';

type Interaction = ReturnType<typeof useInteractionMode>;

/** Everything about listing a drawn plot: the draft on the map, the form and the save. */
export function usePlotRegistration(interaction: Interaction) {
  const form = useForm<PlotFormValues>({
    defaultValues: EMPTY_PLOT_FORM,
    resolver: plotFormResolver,
  });
  const [notice, setNotice] = useState<string | null>(null);
  const createPlot = useCreatePlot({
    onSuccess: () => {
      form.reset(EMPTY_PLOT_FORM);
      interaction.plotSaved();
      setNotice('Plot listed.');
    },
    onError: (error) => {
      for (const [field, message] of Object.entries(describeSaveError(error).fieldErrors)) {
        form.setError(field as PlotFormField, { type: 'server', message });
      }
    },
  });

  const { state } = interaction;
  const boundary = state.mode === 'editingPlot' ? state.boundary : null;
  const draft = useMemo(
    () => (boundary ? polygonCollection('draft', boundary) : undefined),
    [boundary],
  );

  function discard() {
    createPlot.reset();
    form.reset(EMPTY_PLOT_FORM);
  }

  function redraw() {
    createPlot.reset();
    form.clearErrors();
    interaction.drawPlot();
  }

  function cancel() {
    discard();
    interaction.cancel();
  }

  const submit = form.handleSubmit((values) => {
    if (boundary) {
      createPlot.mutate({ boundary, ...toPlotFields(values) });
    }
  });

  return {
    draft,
    isSaving: createPlot.isPending,
    discard,
    cancel,
    notice,
    dismissNotice: () => setNotice(null),
    form: boundary
      ? {
          form,
          alert: describeSaveError(createPlot.error).message,
          isSaving: createPlot.isPending,
          submit,
          redraw,
          cancel,
        }
      : null,
  };
}
