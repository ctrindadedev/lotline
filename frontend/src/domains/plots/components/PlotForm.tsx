import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import type { BaseSyntheticEvent } from 'react';
import { Controller, type Control, type UseFormReturn } from 'react-hook-form';
import type { PlotFormField, PlotFormValues } from '../utils/plotForm';

interface PlotFormProps {
  form: UseFormReturn<PlotFormValues>;
  alert: string | null;
  isSaving: boolean;
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  onRedraw: () => void;
  onCancel: () => void;
}

export function PlotForm({ form, alert, isSaving, onSubmit, onRedraw, onCancel }: PlotFormProps) {
  return (
    <Stack component="form" noValidate spacing={2} onSubmit={onSubmit} aria-label="New plot">
      {alert && <Alert severity="error">{alert}</Alert>}
      <FormTextField
        name="price"
        control={form.control}
        label="Price"
        required
        slotProps={{
          input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> },
          htmlInput: { inputMode: 'decimal' },
        }}
      />
      <FormTextField
        name="description"
        control={form.control}
        label="Description"
        required
        multiline
        minRows={3}
      />
      <FormTextField
        name="contact"
        control={form.control}
        label="Contact"
        required
        placeholder="Phone or email"
      />
      <Stack direction="row" spacing={1}>
        <Button type="submit" variant="contained" loading={isSaving}>
          Save plot
        </Button>
        <Button variant="outlined" onClick={onRedraw} disabled={isSaving}>
          Redraw
        </Button>
        <Button onClick={onCancel} disabled={isSaving}>
          Cancel
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
