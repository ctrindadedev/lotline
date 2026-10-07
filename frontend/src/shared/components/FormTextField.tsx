import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

type FormTextFieldProps<T extends FieldValues> = Omit<TextFieldProps, 'name'> & {
  name: Path<T>;
  control: Control<T>;
};

/** An MUI text field bound to react-hook-form, showing the field's error under it. */
export function FormTextField<T extends FieldValues>({
  name,
  control,
  ...props
}: FormTextFieldProps<T>) {
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
          helperText={fieldState.error?.message ?? props.helperText}
        />
      )}
    />
  );
}
