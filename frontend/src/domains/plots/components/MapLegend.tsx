import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { formatPricePerSquareMeter } from '../../../shared/i18n/format';
import { messages } from '../../../shared/i18n/messages';
import type { PlotStatus } from '../types';
import { STATUS_COLORS } from '../utils/plotLook';
import { RAMP_CSS, type ColourBy, type PriceRange, type PriceScope } from '../utils/priceColours';

const text = messages.legend;
const STATUSES: PlotStatus[] = ['AVAILABLE', 'RESERVED', 'SOLD'];

function Swatch({
  stroke,
  fill,
  dashed = false,
}: {
  stroke: string;
  fill: string;
  dashed?: boolean;
}) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 16,
        height: 12,
        bgcolor: fill,
        border: `2px ${dashed ? 'dashed' : 'solid'} ${stroke}`,
      }}
    />
  );
}

function Item({ swatch, label }: { swatch: ReactNode; label: string }) {
  return (
    <Stack component="li" direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      {swatch}
      <Typography variant="caption">{label}</Typography>
    </Stack>
  );
}

function PriceScale({ range, scope }: { range: PriceRange | null; scope: PriceScope }) {
  if (!range || scope === 'zoomedOut') {
    return (
      <Typography component="li" variant="caption">
        {text.noPrices[scope]}
      </Typography>
    );
  }
  return (
    <li>
      <Box
        aria-hidden
        sx={{
          width: 160,
          height: 10,
          borderRadius: 0.5,
          background: `linear-gradient(to right, ${RAMP_CSS.join(', ')})`,
        }}
      />
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Typography variant="caption">{formatPricePerSquareMeter(range.min, 1)}</Typography>
        <Typography variant="caption">{formatPricePerSquareMeter(range.max, 1)}</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" component="p">
        {text.logScale[scope]}
      </Typography>
    </li>
  );
}

interface MapLegendProps {
  colourBy: ColourBy;
  onColourBy: (mode: ColourBy) => void;
  priceRange: PriceRange | null;
  priceScope: PriceScope;
}

export function MapLegend({ colourBy, onColourBy, priceRange, priceScope }: MapLegendProps) {
  return (
    <Paper elevation={2} sx={{ px: 1.5, py: 1 }}>
      <ToggleButtonGroup
        value={colourBy}
        exclusive
        size="small"
        aria-label={text.colourBy}
        onChange={(_, mode: ColourBy | null) => mode && onColourBy(mode)}
        sx={{ mb: 1, '& .MuiToggleButton-root': { py: 0.25, px: 1, textTransform: 'none' } }}
      >
        <ToggleButton value="status">{text.modes.status}</ToggleButton>
        <ToggleButton value="price">{text.modes.price}</ToggleButton>
      </ToggleButtonGroup>
      <Stack
        component="ul"
        aria-label={text.label}
        spacing={0.25}
        sx={{ m: 0, p: 0, listStyle: 'none' }}
      >
        {colourBy === 'status' ? (
          STATUSES.map((status) => (
            <Item
              key={status}
              swatch={<Swatch {...STATUS_COLORS[status]} />}
              label={messages.popup.status[status]}
            />
          ))
        ) : (
          <PriceScale range={priceRange} scope={priceScope} />
        )}
        <Item swatch={<Swatch stroke="#57606a" fill="transparent" dashed />} label={text.mine} />
      </Stack>
    </Paper>
  );
}
