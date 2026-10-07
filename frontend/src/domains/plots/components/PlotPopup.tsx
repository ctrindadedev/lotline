import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';
import {
  formatArea,
  formatDate,
  formatPrice,
  formatPricePerSquareMeter,
} from '../../../shared/i18n/format';
import { messages } from '../../../shared/i18n/messages';
import { polygonAreaSquareMeters } from '../../../shared/map/geodesy';
import type { AuthRedirect } from '../../auth';
import type { PlotFeature } from '../types';

const text = messages.popup;
const SEE_CONTACT: AuthRedirect = { from: '/', reason: 'seeContact' };

interface PlotPopupProps {
  plot: PlotFeature;
  onClose: () => void;
  /** Only for the plot's owner. */
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PlotPopup({ plot, onClose, onEdit, onDelete }: PlotPopupProps) {
  const { price, description, contact, createdAt } = plot.properties;
  const area = polygonAreaSquareMeters(plot.geometry);

  return (
    <Paper
      elevation={6}
      role="dialog"
      aria-label={text.label}
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
        <IconButton
          aria-label={text.close}
          size="small"
          onClick={onClose}
          sx={{ mt: -0.5, mr: -1 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Divider sx={{ my: 1.5 }} />
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 1.5 }}>
        {description}
      </Typography>
      <Typography variant="body2">
        <strong>{text.contact}</strong>{' '}
        {contact ?? (
          <Link component={RouterLink} to="/login" state={SEE_CONTACT}>
            {text.contactHidden}
          </Link>
        )}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {text.listedOn(formatDate(createdAt))}
      </Typography>
      {onEdit && onDelete && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button size="small" variant="outlined" onClick={onEdit}>
            {text.edit}
          </Button>
          <Button size="small" color="error" onClick={onDelete}>
            {text.delete}
          </Button>
        </Stack>
      )}
    </Paper>
  );
}
