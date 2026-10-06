import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import { useMapPage } from '../hooks/useMapPage';
import styles from './MapPage.module.css';
import { MapToolbar } from './MapToolbar';
import { PlotForm } from './PlotForm';

export function MapPage() {
  const { mapTargetRef, plotsStatus, mode, hint, toolbar, plotForm, notice, dismissNotice } =
    useMapPage();

  return (
    <div className={styles.page}>
      <section className={styles.mapArea} aria-label="Map">
        <div role="toolbar" aria-label="Map tools" className={styles.toolbar}>
          <MapToolbar
            mode={mode}
            onDrawPlot={toolbar.drawPlot}
            onDrawSearch={toolbar.drawSearch}
            onCancel={toolbar.cancel}
            disabled={toolbar.disabled}
          />
        </div>
        <div ref={mapTargetRef} className={styles.map} data-testid="map" />
      </section>
      <aside className={styles.panel} aria-label="Plot panel">
        <Typography variant="h6" component="h2" gutterBottom>
          {plotForm ? 'New plot' : 'Plots'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {hint}
        </Typography>
        {plotForm ? (
          <PlotForm
            form={plotForm.form}
            alert={plotForm.alert}
            isSaving={plotForm.isSaving}
            onSubmit={plotForm.submit}
            onRedraw={plotForm.redraw}
            onCancel={plotForm.cancel}
          />
        ) : (
          <Typography role="status" variant="subtitle2">
            {plotsStatus}
          </Typography>
        )}
      </aside>
      <Snackbar
        open={notice !== null}
        message={notice}
        autoHideDuration={4000}
        onClose={dismissNotice}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      />
    </div>
  );
}
