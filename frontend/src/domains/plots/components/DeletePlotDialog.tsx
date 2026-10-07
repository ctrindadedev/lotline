import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { messages } from '../../../shared/i18n/messages';

interface DeletePlotDialogProps {
  open: boolean;
  alert: string | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeletePlotDialog({
  open,
  alert,
  isDeleting,
  onConfirm,
  onClose,
}: DeletePlotDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <DialogTitle>{messages.manage.deleteTitle}</DialogTitle>
      <DialogContent>
        {alert && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {alert}
          </Alert>
        )}
        <DialogContentText>{messages.manage.deleteBody}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          {messages.manage.cancel}
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} loading={isDeleting}>
          {messages.manage.confirmDelete}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
