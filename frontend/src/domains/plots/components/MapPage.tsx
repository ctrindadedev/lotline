import { useMapPage } from '../hooks/useMapPage';
import styles from './MapPage.module.css';

export function MapPage() {
  const { mapTargetRef, plotsStatus } = useMapPage();

  return (
    <div className={styles.page}>
      <section className={styles.mapArea} aria-label="Map">
        <div role="toolbar" aria-label="Map tools" className={styles.toolbar} />
        <div ref={mapTargetRef} className={styles.map} data-testid="map" />
      </section>
      <aside className={styles.panel} aria-label="Plot panel">
        <h2 className={styles.panelTitle}>Plots</h2>
        <p className={styles.hint}>
          Pan and zoom the map to explore. Use the toolbar to list a plot or search an area.
        </p>
        <p role="status" className={styles.status}>
          {plotsStatus}
        </p>
      </aside>
    </div>
  );
}
