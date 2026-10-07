import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
import type { PlotFeature, PlotStatus } from '../types';
import { describeStatus } from '../utils/reservation';

const text = messages.popup;
const SEE_CONTACT: AuthRedirect = { from: '/', reason: 'seeContact' };

const STATUS_COLOR: Record<PlotStatus, 'success' | 'warning' | 'default'> = {
  AVAILABLE: 'success',
  RESERVED: 'warning',
  SOLD: 'default',
};

export interface PlotPopupAction {
  label: string;
  onClick: () => void;
  color?: 'primary' | 'error';
}

interface PlotPopupProps {
  plot: PlotFeature;
  onClose: () => void;
  /** What the user asking can do with this plot, first one highlighted. */
  actions?: PlotPopupAction[];
  busy?: boolean;
}

export function PlotPopup({ plot, onClose, actions = [], busy = false }: PlotPopupProps) {
  const { price, description, contact, createdAt, status } = plot.properties;
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
      <Chip
        size="small"
        color={STATUS_COLOR[status]}
        label={describeStatus(plot.properties)}
        sx={{ mt: 1 }}
      />
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
      {actions.length > 0 && (
        <Stack direction="row" sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
          {actions.map((action, index) => (
            <Button
              key={action.label}
              size="small"
              variant={index === 0 ? 'outlined' : 'text'}
              color={action.color ?? 'primary'}
              disabled={busy}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
