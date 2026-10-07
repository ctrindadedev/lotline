import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { createPortal } from 'react-dom';
import { messages } from '../../../shared/i18n/messages';
import { useMapPage } from '../hooks/useMapPage';
import styles from './MapPage.module.css';
import { MapToolbar } from './MapToolbar';
import { ConfirmDialog } from './ConfirmDialog';
import { EditPlotDialog } from './EditPlotDialog';
import { PlotForm } from './PlotForm';
import { PlotPopup } from './PlotPopup';
import { SearchPanel } from './SearchPanel';

export function MapPage() {
  const {
    mapTargetRef,
    plotsStatus,
    mode,
    hint,
    toolbar,
    drawing,
    plotForm,
    searchPanel,
    details,
    management,
    sale,
    notice,
    dismissNotice,
  } = useMapPage();

  return (
    <div className={styles.page}>
      <section className={styles.mapArea} aria-label={messages.map.region}>
        <div role="toolbar" aria-label={messages.map.tools} className={styles.toolbar}>
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
      <aside className={styles.panel} aria-label={messages.map.panel}>
        <Typography variant="h6" component="h2" gutterBottom>
          {plotForm
            ? messages.panel.newPlot
            : searchPanel
              ? messages.panel.search
              : messages.panel.plots}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {hint}
        </Typography>
        {drawing && (
          <Stack spacing={1} sx={{ mb: 2, alignItems: 'flex-start' }}>
            <Typography variant="caption" color="text.secondary">
              {drawing.canUndo ? messages.drawing.plotShortcuts : messages.drawing.searchShortcuts}
            </Typography>
            {drawing.canUndo && (
              <Button size="small" variant="outlined" onClick={drawing.undoLastPoint}>
                {messages.drawing.undo}
              </Button>
            )}
          </Stack>
        )}
        {plotForm ? (
          <PlotForm
            form={plotForm.form}
            areaSquareMeters={plotForm.areaSquareMeters}
            alert={plotForm.alert}
            isSaving={plotForm.isSaving}
            onSubmit={plotForm.submit}
            onRedraw={plotForm.redraw}
            onCancel={plotForm.cancel}
          />
        ) : searchPanel ? (
          <SearchPanel
            form={searchPanel.form}
            radius={searchPanel.radius}
            capped={searchPanel.capped}
            status={searchPanel.status}
            onApplyFilters={searchPanel.applyFilters}
            onClearFilters={searchPanel.clearFilters}
            onNewSearch={searchPanel.newSearch}
          />
        ) : (
          <Typography role="status" variant="subtitle2">
            {plotsStatus}
          </Typography>
        )}
      </aside>
      {details.plot &&
        createPortal(
          <PlotPopup
            plot={details.plot}
            onClose={details.close}
            actions={details.actions}
            busy={details.busy}
          />,
          details.overlayElement,
        )}
      <EditPlotDialog
        open={management.edit.open}
        form={management.edit.form}
        alert={management.edit.alert}
        isSaving={management.edit.isSaving}
        onSubmit={management.edit.submit}
        onClose={management.edit.close}
      />
      <ConfirmDialog
        open={management.remove.open}
        title={messages.manage.deleteTitle}
        body={messages.manage.deleteBody}
        confirmLabel={messages.manage.confirmDelete}
        cancelLabel={messages.manage.cancel}
        color="error"
        alert={management.remove.alert}
        isWorking={management.remove.isDeleting}
        onConfirm={management.remove.confirm}
        onClose={management.remove.close}
      />
      <ConfirmDialog
        open={sale.open}
        title={messages.reservation.saleTitle}
        body={messages.reservation.saleBody}
        confirmLabel={messages.reservation.actions.sell}
        cancelLabel={messages.reservation.back}
        isWorking={sale.isSelling}
        onConfirm={sale.confirm}
        onClose={sale.close}
      />
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
