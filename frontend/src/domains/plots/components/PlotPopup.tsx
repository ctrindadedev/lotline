import CloseIcon from '@mui/icons-material/Close';
import ContactMailOutlined from '@mui/icons-material/ContactMailOutlined';
import Box from '@mui/material/Box';
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
import { StatusChip } from './StatusChip';

const text = messages.popup;
const SEE_CONTACT: AuthRedirect = { from: '/', reason: 'seeContact' };

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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Typography variant="caption" color="text.secondary" component="dt">
        {label}
      </Typography>
      <Typography variant="body2" component="dd" sx={{ m: 0, fontWeight: 500 }}>
        {value}
      </Typography>
    </div>
  );
}

export function PlotPopup({ plot, onClose, actions = [], busy = false }: PlotPopupProps) {
  const { price, description, contact, createdAt } = plot.properties;
  const area = polygonAreaSquareMeters(plot.geometry);

  return (
    <Paper
      elevation={6}
      role="dialog"
      aria-label={text.label}
      sx={{ width: 320, maxWidth: '80vw', overflow: 'hidden' }}
    >
      <Box sx={{ px: 2, pt: 1.5, pb: 1.5 }}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Stack spacing={0.75} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="h6" component="p" sx={{ lineHeight: 1.2 }}>
              {formatPrice(price)}
            </Typography>
            <StatusChip plot={plot.properties} />
          </Stack>
          <IconButton aria-label={text.close} size="small" onClick={onClose} sx={{ mr: -1 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Box
          component="dl"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, auto)',
            justifyContent: 'space-between',
            columnGap: 2,
            my: 1.5,
            '& dd': { whiteSpace: 'nowrap' },
          }}
        >
          <Fact label={text.area} value={formatArea(area)} />
          <Fact label={text.pricePerSquareMeter} value={formatPricePerSquareMeter(price, area)} />
          <Fact label={text.listed} value={formatDate(createdAt)} />
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 1.5 }}>
          {description}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <ContactMailOutlined fontSize="small" color="action" aria-hidden />
          <Typography variant="body2">
            <strong>{text.contact}</strong>{' '}
            {contact ?? (
              <Link component={RouterLink} to="/login" state={SEE_CONTACT}>
                {text.contactHidden}
              </Link>
            )}
          </Typography>
        </Stack>
      </Box>
      {actions.length > 0 && (
        <>
          <Divider />
          <Stack
            direction="row"
            sx={{ px: 2, py: 1, flexWrap: 'wrap', gap: 1, bgcolor: 'action.hover' }}
          >
            {actions.map((action, index) => (
              <Button
                key={action.label}
                size="small"
                variant={index === 0 ? 'contained' : 'text'}
                color={action.color ?? 'primary'}
                disabled={busy}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        </>
      )}
    </Paper>
  );
}
