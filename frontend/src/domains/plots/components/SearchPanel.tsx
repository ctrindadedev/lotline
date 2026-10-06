import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { BaseSyntheticEvent } from 'react';
import { Controller, type Control, type UseFormReturn } from 'react-hook-form';
import { formatDistance } from '../../../shared/i18n/format';
import { messages } from '../../../shared/i18n/messages';
import { MAX_SEARCH_RADIUS_METERS } from '../hooks/usePlotSearch';
import type { SearchFilterValues } from '../utils/searchFilters';

const text = messages.search;

interface SearchPanelProps {
  form: UseFormReturn<SearchFilterValues>;
  radius: string;
  capped: boolean;
  status: string;
  onApplyFilters: (event?: BaseSyntheticEvent) => Promise<void>;
  onClearFilters: () => void;
  onNewSearch: () => void;
}

export function SearchPanel({
  form,
  radius,
  capped,
  status,
  onApplyFilters,
  onClearFilters,
  onNewSearch,
}: SearchPanelProps) {
  return (
    <Stack spacing={2}>
      <div>
        <Typography variant="body2">{text.radius(radius)}</Typography>
        {capped && (
          <Typography variant="caption" color="text.secondary">
            {text.capped(formatDistance(MAX_SEARCH_RADIUS_METERS))}
          </Typography>
        )}
        <Typography role="status" variant="subtitle2" sx={{ mt: 1 }}>
          {status}
        </Typography>
      </div>
      <Stack
        component="form"
        noValidate
        spacing={1.5}
        onSubmit={onApplyFilters}
        aria-label={text.filters}
      >
        <Typography variant="subtitle2" component="h3">
          {text.filters}
        </Typography>
        <Stack direction="row" spacing={1}>
          <FilterField name="minPrice" control={form.control} label={text.minPrice} unit="R$" />
          <FilterField name="maxPrice" control={form.control} label={text.maxPrice} unit="R$" />
        </Stack>
        <Stack direction="row" spacing={1}>
          <FilterField name="minArea" control={form.control} label={text.minArea} unit="m²" end />
          <FilterField name="maxArea" control={form.control} label={text.maxArea} unit="m²" end />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" size="small">
            {text.apply}
          </Button>
          <Button size="small" onClick={onClearFilters}>
            {text.clear}
          </Button>
        </Stack>
      </Stack>
      <Button variant="outlined" onClick={onNewSearch}>
        {text.newCircle}
      </Button>
    </Stack>
  );
}

type FilterFieldProps = Omit<TextFieldProps, 'name'> & {
  name: keyof SearchFilterValues;
  control: Control<SearchFilterValues>;
  unit: string;
  end?: boolean;
};

function FilterField({ name, control, unit, end = false, ...props }: FilterFieldProps) {
  const adornment = <InputAdornment position={end ? 'end' : 'start'}>{unit}</InputAdornment>;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { ref, ...field }, fieldState }) => (
        <TextField
          {...props}
          {...field}
          inputRef={ref}
          size="small"
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          slotProps={{
            input: end ? { endAdornment: adornment } : { startAdornment: adornment },
            htmlInput: { inputMode: 'decimal' },
          }}
        />
      )}
    />
  );
}
