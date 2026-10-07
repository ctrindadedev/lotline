import Chip from '@mui/material/Chip';
import type { PlotProperties, PlotStatus } from '../types';
import { describeStatus } from '../utils/reservation';

const COLOR: Record<PlotStatus, 'success' | 'warning' | 'default'> = {
  AVAILABLE: 'success',
  RESERVED: 'warning',
  SOLD: 'default',
};

export function StatusChip({ plot }: { plot: PlotProperties }) {
  return <Chip size="small" color={COLOR[plot.status]} label={describeStatus(plot)} />;
}
