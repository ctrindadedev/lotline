import { useSearchParams } from 'react-router';
import type { PlotFeature } from '../types';
import { useMyPlots } from './useMyPlots';

export type PanelTab = 'area' | 'mine' | 'reserved';

const PARAM = 'panel';

/**
 * The side panel's tabs: the plots in view for everyone, the user's listings and reservations once
 * logged in. The tab is in the URL (`?panel=mine`), so the account menu can link to it.
 */
export function usePlotsPanel(inView: PlotFeature[], userId: string | null) {
  const [params, setParams] = useSearchParams();
  const mine = useMyPlots(userId);
  const loggedIn = userId !== null;
  const requested = params.get(PARAM);
  const tab: PanelTab =
    loggedIn && (requested === 'mine' || requested === 'reserved') ? requested : 'area';
  const lists: Record<PanelTab, PlotFeature[]> = {
    area: inView,
    mine: mine.listed,
    reserved: mine.reserved,
  };

  return {
    /** The tab the URL asks for, as given: changes when the account menu links to a tab. */
    requested,
    tab,
    tabs: (loggedIn ? ['area', 'mine', 'reserved'] : ['area']) as PanelTab[],
    selectTab: (next: PanelTab) =>
      setParams(next === 'area' ? {} : { [PARAM]: next }, { replace: true }),
    plots: lists[tab],
    myPlots: mine.plots,
    myPlotsLoading: mine.isLoading,
    myPlotsFailed: mine.error !== null,
  };
}
