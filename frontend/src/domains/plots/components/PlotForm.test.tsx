import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { EMPTY_PLOT_FORM, plotFormResolver, type PlotFormValues } from '../utils/plotForm';
import { PlotForm } from './PlotForm';
import { messages } from '../../../shared/i18n/messages';

type Alert = { message: string | null; detail: string | null };

const NO_ALERT: Alert = { message: null, detail: null };

interface HarnessProps {
  alert?: Alert;
  isSaving?: boolean;
  onValid: (values: PlotFormValues) => void;
  onRedraw: () => void;
  onCancel: () => void;
  expose: (form: UseFormReturn<PlotFormValues>) => void;
}

function Harness({ alert = NO_ALERT, isSaving = false, onValid, expose, ...rest }: HarnessProps) {
  const form = useForm<PlotFormValues>({
    defaultValues: EMPTY_PLOT_FORM,
    resolver: plotFormResolver,
  });
  expose(form);
  return (
    <PlotForm
      form={form}
      areaSquareMeters={1000}
      alert={alert}
      isSaving={isSaving}
      onSubmit={form.handleSubmit(onValid)}
      {...rest}
    />
  );
}

function renderForm(props: { alert?: Alert; isSaving?: boolean } = {}) {
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
  await userEvent.type(
    screen.getByRole('textbox', { name: new RegExp(messages.plotForm.price) }),
    price,
  );
  await userEvent.type(
    screen.getByRole('textbox', { name: new RegExp(messages.plotForm.description) }),
    description,
  );
  await userEvent.type(
    screen.getByRole('textbox', { name: new RegExp(messages.plotForm.contact) }),
    contact,
  );
}

describe('PlotForm', () => {
  it('submits the values the user typed', async () => {
    const { onValid } = renderForm();

    await fillIn('150000,50', 'Corner plot', 'seller@example.com');
    await userEvent.click(screen.getByRole('button', { name: messages.plotForm.save }));

    expect(onValid).toHaveBeenCalledWith(
      { price: '150000,50', description: 'Corner plot', contact: 'seller@example.com' },
      expect.anything(),
    );
  });

  it('blocks an incomplete form and clears an error once the field is fixed', async () => {
    const { onValid } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: messages.plotForm.save }));

    expect(onValid).not.toHaveBeenCalled();
    expect(screen.getByText(messages.plotForm.errors.descriptionRequired)).toBeInTheDocument();
    expect(screen.getByText(messages.plotForm.errors.contactRequired)).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole('textbox', { name: new RegExp(messages.plotForm.description) }),
      'x',
    );
    expect(
      screen.queryByText(messages.plotForm.errors.descriptionRequired),
    ).not.toBeInTheDocument();
  });

  it('shows an API error on its field until the user fixes that field', async () => {
    const { form } = renderForm();
    await fillIn('10', 'Corner plot', 'seller@example.com');
    await userEvent.click(screen.getByRole('button', { name: messages.plotForm.save }));

    act(() => {
      form().setError('price', { type: 'server', message: 'must be at most 1000' });
      form().setError('contact', { type: 'server', message: 'is already in use' });
    });
    expect(screen.getByText('must be at most 1000')).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole('textbox', { name: new RegExp(messages.plotForm.price) }),
      '0',
    );

    expect(screen.queryByText('must be at most 1000')).not.toBeInTheDocument();
    expect(screen.getByText('is already in use')).toBeInTheDocument();
  });

  it('shows the area, and the price per m² once the price is valid', async () => {
    renderForm();
    const summary = screen.getByText(new RegExp(messages.plotForm.area('')));

    expect(summary).toHaveTextContent(messages.plotForm.area('1.000 m²'));

    await userEvent.type(
      screen.getByRole('textbox', { name: new RegExp(messages.plotForm.price) }),
      '150000',
    );

    expect(summary).toHaveTextContent(
      messages.plotForm.areaAndPricePerSquareMeter('1.000 m²', 'R$ 150,00/m²'),
    );
  });

  it('shows the alert it is given', () => {
    renderForm({
      alert: { message: messages.plotForm.saveErrors.invalidDrawing, detail: 'Self-intersection' },
    });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(messages.plotForm.saveErrors.invalidDrawing);
    expect(alert).toHaveTextContent(messages.plotForm.technicalDetail('Self-intersection'));
  });

  it('lets the user redraw or cancel', async () => {
    const { onRedraw, onCancel } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: messages.plotForm.redraw }));
    await userEvent.click(screen.getByRole('button', { name: messages.plotForm.cancel }));

    expect(onRedraw).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('disables every action while saving', () => {
    renderForm({ isSaving: true });

    expect(screen.getByRole('button', { name: messages.plotForm.save })).toBeDisabled();
    expect(screen.getByRole('button', { name: messages.plotForm.redraw })).toBeDisabled();
    expect(screen.getByRole('button', { name: messages.plotForm.cancel })).toBeDisabled();
  });
});
