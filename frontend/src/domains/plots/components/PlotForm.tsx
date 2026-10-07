import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { BaseSyntheticEvent } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { FormTextField } from '../../../shared/components/FormTextField';
import { formatArea, formatPricePerSquareMeter } from '../../../shared/i18n/format';
import { messages } from '../../../shared/i18n/messages';
import { parsePrice, type PlotFormValues, type SaveErrorView } from '../utils/plotForm';

const text = messages.plotForm;

interface PlotFormProps {
  form: UseFormReturn<PlotFormValues>;
  areaSquareMeters: number;
  alert: Pick<SaveErrorView, 'message' | 'detail'>;
  isSaving: boolean;
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  onRedraw: () => void;
  onCancel: () => void;
}

export function PlotForm({
  form,
  areaSquareMeters,
  alert,
  isSaving,
  onSubmit,
  onRedraw,
  onCancel,
}: PlotFormProps) {
  const price = parsePrice(useWatch({ control: form.control, name: 'price' }));
  const area = formatArea(areaSquareMeters);

  return (
    <Stack component="form" noValidate spacing={2} onSubmit={onSubmit} aria-label={text.label}>
      {alert.message && (
        <Alert severity="error">
          {alert.message}
          {alert.detail && (
            <Typography variant="caption" component="p" sx={{ mt: 0.5, opacity: 0.8 }}>
              {text.technicalDetail(alert.detail)}
            </Typography>
          )}
        </Alert>
      )}
      <Typography variant="body2" aria-live="polite">
        {price === null
          ? text.area(area)
          : text.areaAndPricePerSquareMeter(
              area,
              formatPricePerSquareMeter(price, areaSquareMeters),
            )}
      </Typography>
      <FormTextField
        name="price"
        control={form.control}
        label={text.price}
        required
        slotProps={{
          input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> },
          htmlInput: { inputMode: 'decimal' },
        }}
      />
      <FormTextField
        name="description"
        control={form.control}
        label={text.description}
        required
        multiline
        minRows={3}
      />
      <FormTextField
        name="contact"
        control={form.control}
        label={text.contact}
        required
        placeholder={text.contactPlaceholder}
      />
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', whiteSpace: 'nowrap' }}>
        <Button type="submit" variant="contained" loading={isSaving}>
          {text.save}
        </Button>
        <Button variant="outlined" onClick={onRedraw} disabled={isSaving}>
          {text.redraw}
        </Button>
        <Button onClick={onCancel} disabled={isSaving}>
          {text.cancel}
        </Button>
      </Stack>
    </Stack>
  );
}
