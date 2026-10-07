import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatArea, formatPrice, formatPricePerSquareMeter } from '../../../shared/i18n/format';
import { messages } from '../../../shared/i18n/messages';
import { polygonAreaSquareMeters } from '../../../shared/map/geodesy';
import type { PlotFeature } from '../types';
import { StatusChip } from './StatusChip';

interface PlotCardProps {
  plot: PlotFeature;
  selected: boolean;
  onSelect: () => void;
}

export function PlotCard({ plot, selected, onSelect }: PlotCardProps) {
  const { price, description, ownedByMe } = plot.properties;
  const area = polygonAreaSquareMeters(plot.geometry);

  return (
    <Card variant="outlined" sx={{ borderColor: selected ? 'primary.main' : undefined }}>
      <CardActionArea onClick={onSelect} aria-current={selected || undefined}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
          >
            <Typography variant="subtitle1" component="p" sx={{ fontWeight: 600 }}>
              {formatPrice(price)}
            </Typography>
            <StatusChip plot={plot.properties} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {formatArea(area)} · {formatPricePerSquareMeter(price, area)}
            {ownedByMe && ` · ${messages.legend.mine}`}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
