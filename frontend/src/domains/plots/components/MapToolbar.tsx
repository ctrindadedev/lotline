import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import Paper from '@mui/material/Paper';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { toolbarModeFor, type InteractionMode } from '../utils/interactionMode';

interface MapToolbarProps {
  mode: InteractionMode;
  onDrawPlot: () => void;
  onDrawSearch: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function MapToolbar({
  mode,
  onDrawPlot,
  onDrawSearch,
  onCancel,
  disabled = false,
}: MapToolbarProps) {
  const editing = mode === 'editingPlot';

  function handleChange(_: unknown, selected: ReturnType<typeof toolbarModeFor>) {
    if (selected === null && editing) {
      return;
    }
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
        value={toolbarModeFor(mode)}
        onChange={handleChange}
        disabled={disabled}
        aria-label="Map mode"
      >
        <ToggleButton value="drawingPlot">
          <AddLocationAltIcon fontSize="small" sx={{ mr: 1 }} />
          {editing ? 'Editing plot' : 'List a plot'}
        </ToggleButton>
        <ToggleButton value="drawingSearch">
          <TravelExploreIcon fontSize="small" sx={{ mr: 1 }} />
          Search an area
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
}
