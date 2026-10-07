import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  color?: 'primary' | 'error';
  alert?: string | null;
  isWorking: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Asks before an action that cannot be undone. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  color = 'primary',
  alert,
  isWorking,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {alert && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {alert}
          </Alert>
        )}
        <DialogContentText>{body}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isWorking}>
          {cancelLabel}
        </Button>
        <Button color={color} variant="contained" onClick={onConfirm} loading={isWorking}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
