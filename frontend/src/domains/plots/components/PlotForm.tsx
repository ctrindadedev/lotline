import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { BaseSyntheticEvent } from 'react';
import { Controller, type Control, type UseFormReturn } from 'react-hook-form';
import { messages } from '../../../shared/i18n/messages';
import type { PlotFormField, PlotFormValues, SaveErrorView } from '../utils/plotForm';

const text = messages.plotForm;

interface PlotFormProps {
  form: UseFormReturn<PlotFormValues>;
  alert: Pick<SaveErrorView, 'message' | 'detail'>;
  isSaving: boolean;
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  onRedraw: () => void;
  onCancel: () => void;
}

export function PlotForm({ form, alert, isSaving, onSubmit, onRedraw, onCancel }: PlotFormProps) {
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
      <Stack direction="row" spacing={1}>
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

type FormTextFieldProps = Omit<TextFieldProps, 'name'> & {
  name: PlotFormField;
  control: Control<PlotFormValues>;
};

function FormTextField({ name, control, ...props }: FormTextFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { ref, ...field }, fieldState }) => (
        <TextField
          {...props}
          {...field}
          inputRef={ref}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );
}
