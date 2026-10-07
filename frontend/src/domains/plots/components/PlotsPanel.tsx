import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { messages } from '../../../shared/i18n/messages';
import type { PanelTab } from '../hooks/usePlotsPanel';
import type { PlotFeature } from '../types';
import { PlotList } from './PlotList';

const text = messages.plotsPanel;

interface PlotsPanelProps {
  tab: PanelTab;
  tabs: PanelTab[];
  onSelectTab: (tab: PanelTab) => void;
  plots: PlotFeature[];
  areaStatus: string;
  myPlotsLoading: boolean;
  myPlotsFailed: boolean;
  selectedId: string | null;
  onSelectPlot: (plot: PlotFeature) => void;
}

function myPlotsStatus(tab: PanelTab, loading: boolean, failed: boolean, empty: boolean) {
  if (failed) {
    return text.failedMine;
  }
  if (loading) {
    return text.loadingMine;
  }
  if (!empty) {
    return null;
  }
  return tab === 'mine' ? text.noneListed : text.noneReserved;
}

export function PlotsPanel({
  tab,
  tabs,
  onSelectTab,
  plots,
  areaStatus,
  myPlotsLoading,
  myPlotsFailed,
  selectedId,
  onSelectPlot,
}: PlotsPanelProps) {
  const status =
    tab === 'area'
      ? areaStatus
      : myPlotsStatus(tab, myPlotsLoading, myPlotsFailed, plots.length === 0);

  return (
    <>
      {tabs.length > 1 && (
        <Tabs
          value={tab}
          onChange={(_, next: PanelTab) => onSelectTab(next)}
          aria-label={text.tabsLabel}
          variant="fullWidth"
          sx={{
            mb: 2,
            minHeight: 0,
            '& .MuiTab-root': {
              minHeight: 40,
              px: 0.5,
              fontSize: '0.8125rem',
              fontWeight: 600,
              textTransform: 'none',
              whiteSpace: 'nowrap',
            },
          }}
        >
          {tabs.map((value) => (
            <Tab key={value} value={value} label={text.tabs[value]} />
          ))}
        </Tabs>
      )}
      {status && (
        <Typography role="status" variant="subtitle2" sx={{ mb: 1.5 }}>
          {status}
        </Typography>
      )}
      <PlotList plots={plots} selectedId={selectedId} onSelect={onSelectPlot} />
    </>
  );
}
