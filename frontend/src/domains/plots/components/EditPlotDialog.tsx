import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import type { BaseSyntheticEvent } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { FormTextField } from '../../../shared/components/FormTextField';
import { messages } from '../../../shared/i18n/messages';
import type { PlotFormValues } from '../utils/plotForm';

interface EditPlotDialogProps {
  open: boolean;
  form: UseFormReturn<PlotFormValues>;
  alert: string | null;
  isSaving: boolean;
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  onClose: () => void;
}

export function EditPlotDialog({
  open,
  form,
  alert,
  isSaving,
  onSubmit,
  onClose,
}: EditPlotDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form noValidate onSubmit={onSubmit} aria-label={messages.manage.editTitle}>
        <DialogTitle>{messages.manage.editTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {alert && <Alert severity="error">{alert}</Alert>}
            <FormTextField
              name="price"
              control={form.control}
              label={messages.plotForm.price}
              required
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> },
                htmlInput: { inputMode: 'decimal' },
              }}
            />
            <FormTextField
              name="description"
              control={form.control}
              label={messages.plotForm.description}
              required
              multiline
              minRows={3}
            />
            <FormTextField
              name="contact"
              control={form.control}
              label={messages.plotForm.contact}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving}>
            {messages.manage.cancel}
          </Button>
          <Button type="submit" variant="contained" loading={isSaving}>
            {messages.manage.save}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
