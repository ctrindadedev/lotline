import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import Paper from '@mui/material/Paper';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { InteractionMode } from '../utils/interactionMode';

interface MapToolbarProps {
  mode: InteractionMode;
  onDrawPlot: () => void;
  onDrawSearch: () => void;
  onCancel: () => void;
}

export function MapToolbar({ mode, onDrawPlot, onDrawSearch, onCancel }: MapToolbarProps) {
  function handleChange(_: unknown, selected: InteractionMode | null) {
    if (selected === 'drawingPlot') {
      onDrawPlot();
    } else if (selected === 'drawingSearch') {
      onDrawSearch();
    } else {
      onCancel();
    }
  }

  return (
    <Paper elevation={3}>
      <ToggleButtonGroup
        exclusive
        size="small"
        color="primary"
        value={mode === 'idle' ? null : mode}
        onChange={handleChange}
        aria-label="Map mode"
      >
        <ToggleButton value="drawingPlot">
          <AddLocationAltIcon fontSize="small" sx={{ mr: 1 }} />
          List a plot
        </ToggleButton>
        <ToggleButton value="drawingSearch">
          <TravelExploreIcon fontSize="small" sx={{ mr: 1 }} />
          Search an area
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
}
