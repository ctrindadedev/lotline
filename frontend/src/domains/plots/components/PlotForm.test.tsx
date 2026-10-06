import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { EMPTY_PLOT_FORM, plotFormResolver, type PlotFormValues } from '../utils/plotForm';
import { PlotForm } from './PlotForm';

interface HarnessProps {
  alert?: string | null;
  isSaving?: boolean;
  onValid: (values: PlotFormValues) => void;
  onRedraw: () => void;
  onCancel: () => void;
  expose: (form: UseFormReturn<PlotFormValues>) => void;
}

function Harness({ alert = null, isSaving = false, onValid, expose, ...rest }: HarnessProps) {
  const form = useForm<PlotFormValues>({
    defaultValues: EMPTY_PLOT_FORM,
    resolver: plotFormResolver,
  });
  expose(form);
  return (
    <PlotForm
      form={form}
      alert={alert}
      isSaving={isSaving}
      onSubmit={form.handleSubmit(onValid)}
      {...rest}
    />
  );
}

function renderForm(props: { alert?: string | null; isSaving?: boolean } = {}) {
  const exposed: { form: UseFormReturn<PlotFormValues> | null } = { form: null };
  const handlers = {
    onValid: vi.fn<(values: PlotFormValues) => void>(),
    onRedraw: vi.fn<() => void>(),
    onCancel: vi.fn<() => void>(),
  };
  render(<Harness {...props} {...handlers} expose={(form) => (exposed.form = form)} />);
  return { ...handlers, form: () => exposed.form! };
}

async function fillIn(price: string, description: string, contact: string) {
  await userEvent.type(screen.getByRole('textbox', { name: /Price/ }), price);
  await userEvent.type(screen.getByRole('textbox', { name: /Description/ }), description);
  await userEvent.type(screen.getByRole('textbox', { name: /Contact/ }), contact);
}

describe('PlotForm', () => {
  it('submits the values the user typed', async () => {
    const { onValid } = renderForm();

    await fillIn('150000,50', 'Corner plot', 'seller@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Save plot' }));

    expect(onValid).toHaveBeenCalledWith(
      { price: '150000,50', description: 'Corner plot', contact: 'seller@example.com' },
      expect.anything(),
    );
  });

  it('blocks an incomplete form and clears an error once the field is fixed', async () => {
    const { onValid } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Save plot' }));

    expect(onValid).not.toHaveBeenCalled();
    expect(screen.getByText('Describe the plot.')).toBeInTheDocument();
    expect(screen.getByText('Enter a phone number or an email.')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox', { name: /Description/ }), 'x');
    expect(screen.queryByText('Describe the plot.')).not.toBeInTheDocument();
  });

  it('shows an API error on its field until the user fixes that field', async () => {
    const { form } = renderForm();
    await fillIn('10', 'Corner plot', 'seller@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Save plot' }));

    act(() => {
      form().setError('price', { type: 'server', message: 'must be at most 1000' });
      form().setError('contact', { type: 'server', message: 'is already in use' });
    });
    expect(screen.getByText('must be at most 1000')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox', { name: /Price/ }), '0');

    expect(screen.queryByText('must be at most 1000')).not.toBeInTheDocument();
    expect(screen.getByText('is already in use')).toBeInTheDocument();
  });

  it('shows the alert it is given', () => {
    renderForm({ alert: 'This plot overlaps a plot that is already listed.' });

    expect(screen.getByRole('alert')).toHaveTextContent(/overlaps a plot/);
  });

  it('lets the user redraw or cancel', async () => {
    const { onRedraw, onCancel } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Redraw' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onRedraw).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('disables every action while saving', () => {
    renderForm({ isSaving: true });

    expect(screen.getByRole('button', { name: /Save plot/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Redraw' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
