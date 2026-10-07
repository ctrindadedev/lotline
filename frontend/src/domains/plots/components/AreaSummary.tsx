import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { formatArea, formatPricePerSquareMeter } from '../../../shared/i18n/format';
import { messages } from '../../../shared/i18n/messages';
import type { PlotsSummary } from '../types';

const text = messages.summary;

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Typography variant="caption" color="text.secondary" component="dt">
        {label}
      </Typography>
      <Typography variant="subtitle2" component="dd" sx={{ m: 0 }}>
        {value}
      </Typography>
    </div>
  );
}

const perSquareMeter = (value: number) => formatPricePerSquareMeter(value, 1);

/** Count per status, total area and the price per m² spread of the plots in view. */
export function AreaSummary({ summary }: { summary: PlotsSummary }) {
  const { available, reserved, sold, totalAreaSquareMeters, medianPricePerSquareMeter } = summary;
  return (
    <Paper variant="outlined" component="section" aria-label={text.label} sx={{ p: 1.5, mb: 1.5 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {text.statuses(available, reserved, sold)}
      </Typography>
      <Box
        component="dl"
        sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, m: 0 }}
      >
        <Figure label={text.totalArea} value={formatArea(totalAreaSquareMeters)} />
        {medianPricePerSquareMeter !== null && (
          <Figure
            label={`${text.pricePerSquareMeter} (${text.median})`}
            value={perSquareMeter(medianPricePerSquareMeter)}
          />
        )}
      </Box>
      {summary.minPricePerSquareMeter !== null && summary.maxPricePerSquareMeter !== null && (
        <Typography variant="caption" color="text.secondary">
          {text.min} {perSquareMeter(summary.minPricePerSquareMeter)} · {text.max}{' '}
          {perSquareMeter(summary.maxPricePerSquareMeter)}
        </Typography>
      )}
    </Paper>
  );
}
