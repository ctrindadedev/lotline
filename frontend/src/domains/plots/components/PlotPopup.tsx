import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { polygonAreaSquareMeters } from '../../../shared/map/geodesy';
import type { PlotFeature } from '../types';
import {
  formatArea,
  formatListedDate,
  formatPrice,
  formatPricePerSquareMeter,
} from '../utils/plotFormat';

interface PlotPopupProps {
  plot: PlotFeature;
  onClose: () => void;
}

export function PlotPopup({ plot, onClose }: PlotPopupProps) {
  const { price, description, contact, createdAt } = plot.properties;
  const area = polygonAreaSquareMeters(plot.geometry);

  return (
    <Paper
      elevation={6}
      role="dialog"
      aria-label="Plot details"
      sx={{ width: 300, maxWidth: '80vw', p: 2 }}
    >
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <Typography variant="h6" component="p">
            {formatPrice(price)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatArea(area)} · {formatPricePerSquareMeter(price, area)}
          </Typography>
        </div>
        <IconButton aria-label="Close" size="small" onClick={onClose} sx={{ mt: -0.5, mr: -1 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Divider sx={{ my: 1.5 }} />
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 1.5 }}>
        {description}
      </Typography>
      <Typography variant="body2">
        <strong>Contact:</strong> {contact}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Listed on {formatListedDate(createdAt)}
      </Typography>
    </Paper>
  );
}
