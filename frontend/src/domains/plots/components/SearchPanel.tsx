import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { BaseSyntheticEvent } from 'react';
import { Controller, type Control, type UseFormReturn } from 'react-hook-form';
import { formatDistance } from '../../../shared/map/geodesy';
import { MAX_SEARCH_RADIUS_METERS } from '../hooks/usePlotSearch';
import type { SearchFilterValues } from '../utils/searchFilters';

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
        <Typography variant="body2">Radius: {radius}</Typography>
        {capped && (
          <Typography variant="caption" color="text.secondary">
            Searches are limited to {formatDistance(MAX_SEARCH_RADIUS_METERS)}.
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
        aria-label="Filters"
      >
        <Typography variant="subtitle2" component="h3">
          Filters
        </Typography>
        <Stack direction="row" spacing={1}>
          <FilterField name="minPrice" control={form.control} label="Min price" unit="R$" />
          <FilterField name="maxPrice" control={form.control} label="Max price" unit="R$" />
        </Stack>
        <Stack direction="row" spacing={1}>
          <FilterField name="minArea" control={form.control} label="Min area" unit="m²" end />
          <FilterField name="maxArea" control={form.control} label="Max area" unit="m²" end />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" size="small">
            Apply filters
          </Button>
          <Button size="small" onClick={onClearFilters}>
            Clear
          </Button>
        </Stack>
      </Stack>
      <Button variant="outlined" onClick={onNewSearch}>
        Draw a new circle
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
