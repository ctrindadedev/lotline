import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import type { TextFieldProps } from '@mui/material/TextField';
import { useState } from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { FormTextField } from './FormTextField';

type PasswordFieldProps<T extends FieldValues> = Omit<TextFieldProps, 'name' | 'type'> & {
  name: Path<T>;
  control: Control<T>;
  showLabel: string;
  hideLabel: string;
};

/** A password field with a button to show what was typed. */
export function PasswordField<T extends FieldValues>({
  showLabel,
  hideLabel,
  ...props
}: PasswordFieldProps<T>) {
  const [visible, setVisible] = useState(false);
  return (
    <FormTextField
      {...props}
      type={visible ? 'text' : 'password'}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={visible ? hideLabel : showLabel}
                onClick={() => setVisible((shown) => !shown)}
                edge="end"
                size="small"
              >
                {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
