import Stack from '@mui/material/Stack';
import { messages } from '../../../shared/i18n/messages';
import type { PlotFeature } from '../types';
import { PlotCard } from './PlotCard';

interface PlotListProps {
  plots: PlotFeature[];
  selectedId: string | null;
  onSelect: (plot: PlotFeature) => void;
}

export function PlotList({ plots, selectedId, onSelect }: PlotListProps) {
  if (plots.length === 0) {
    return null;
  }
  return (
    <Stack
      component="ul"
      aria-label={messages.plotsPanel.list}
      spacing={1}
      sx={{ p: 0, m: 0, listStyle: 'none' }}
    >
      {plots.map((plot) => (
        <li key={plot.id}>
          <PlotCard plot={plot} selected={plot.id === selectedId} onSelect={() => onSelect(plot)} />
        </li>
      ))}
    </Stack>
  );
}
