import Typography from '@mui/material/Typography';
import { useMapPage } from '../hooks/useMapPage';
import styles from './MapPage.module.css';
import { MapToolbar } from './MapToolbar';

export function MapPage() {
  const { mapTargetRef, plotsStatus, interaction, hint } = useMapPage();

  return (
    <div className={styles.page}>
      <section className={styles.mapArea} aria-label="Map">
        <div role="toolbar" aria-label="Map tools" className={styles.toolbar}>
          <MapToolbar
            mode={interaction.mode}
            onDrawPlot={interaction.drawPlot}
            onDrawSearch={interaction.drawSearch}
            onCancel={interaction.cancel}
          />
        </div>
        <div ref={mapTargetRef} className={styles.map} data-testid="map" />
      </section>
      <aside className={styles.panel} aria-label="Plot panel">
        <Typography variant="h6" component="h2" gutterBottom>
          Plots
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {hint}
        </Typography>
        <Typography role="status" variant="subtitle2" sx={{ mt: 1.5 }}>
          {plotsStatus}
        </Typography>
      </aside>
    </div>
  );
}
