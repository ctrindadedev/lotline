import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { messages } from '../../../shared/i18n/messages';
import type { PlotStatus } from '../types';
import { STATUS_COLORS } from '../utils/plotLook';

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

export function MapLegend() {
  return (
    <Paper
      component="ul"
      aria-label={messages.legend.label}
      elevation={2}
      sx={{ m: 0, px: 1.5, py: 1, listStyle: 'none' }}
    >
      {STATUSES.map((status) => (
        <Stack
          key={status}
          component="li"
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center' }}
        >
          <Swatch {...STATUS_COLORS[status]} />
          <Typography variant="caption">{messages.popup.status[status]}</Typography>
        </Stack>
      ))}
      <Stack component="li" direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Swatch stroke={STATUS_COLORS.AVAILABLE.stroke} fill="transparent" dashed />
        <Typography variant="caption">{messages.legend.mine}</Typography>
      </Stack>
    </Paper>
  );
}
