import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { messages } from '../../../shared/i18n/messages';
import { plotFormResolver, type PlotFormValues } from '../utils/plotForm';
import { DeletePlotDialog } from './DeletePlotDialog';
import { EditPlotDialog } from './EditPlotDialog';

function EditHarness({ onValid, onClose }: { onValid: () => void; onClose: () => void }) {
  const form = useForm<PlotFormValues>({
    defaultValues: { price: '1000', description: 'A plot', contact: 'a@b.co' },
    resolver: plotFormResolver,
  });
  return (
    <EditPlotDialog
      open
      form={form}
      alert={messages.manage.errors.notOwner}
      isSaving={false}
      onSubmit={form.handleSubmit(onValid)}
      onClose={onClose}
    />
  );
}

describe('EditPlotDialog', () => {
  it('shows the current values, the reason of a refusal, and saves or cancels', async () => {
    const onValid = vi.fn<() => void>();
    const onClose = vi.fn<() => void>();
    render(<EditHarness onValid={onValid} onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: messages.manage.editTitle })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(messages.manage.errors.notOwner);
    expect(screen.getByDisplayValue('A plot')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: messages.manage.save }));
    await userEvent.click(screen.getByRole('button', { name: messages.manage.cancel }));

    expect(onValid).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('DeletePlotDialog', () => {
  it('asks before deleting', async () => {
    const onConfirm = vi.fn<() => void>();
    const onClose = vi.fn<() => void>();
    render(
      <DeletePlotDialog
        open
        alert={messages.manage.errors.gone}
        isDeleting={false}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('dialog', { name: messages.manage.deleteTitle })).toBeInTheDocument();
    expect(screen.getByText(messages.manage.deleteBody)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(messages.manage.errors.gone);
    await userEvent.click(screen.getByRole('button', { name: messages.manage.confirmDelete }));
    await userEvent.click(screen.getByRole('button', { name: messages.manage.cancel }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
