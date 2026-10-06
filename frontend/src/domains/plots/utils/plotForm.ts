import type { FieldErrors, Resolver } from 'react-hook-form';
import { ApiError } from '../../../shared/lib/http';

export interface PlotFormValues {
  price: string;
  description: string;
  contact: string;
}

export type PlotFormField = keyof PlotFormValues;

export type PlotFieldErrors = Partial<Record<PlotFormField, string>>;

export const EMPTY_PLOT_FORM: PlotFormValues = { price: '', description: '', contact: '' };

const FIELDS: readonly PlotFormField[] = ['price', 'description', 'contact'];
const PRICE_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;
const MAX_DESCRIPTION = 2000;
const MAX_CONTACT = 255;

function normalizePrice(price: string): string {
  return price.trim().replace(',', '.');
}

/** Mirrors the API's rules, so most mistakes are caught before the request. */
export function validatePlotForm(values: PlotFormValues): PlotFieldErrors {
  const errors: PlotFieldErrors = {};
  const price = normalizePrice(values.price);
  if (!PRICE_PATTERN.test(price) || Number(price) <= 0) {
    errors.price = 'Enter a price above 0, with up to 2 decimals.';
  }
  if (!values.description.trim()) {
    errors.description = 'Describe the plot.';
  } else if (values.description.trim().length > MAX_DESCRIPTION) {
    errors.description = `Use at most ${MAX_DESCRIPTION} characters.`;
  }
  if (!values.contact.trim()) {
    errors.contact = 'Enter a phone number or an email.';
  } else if (values.contact.trim().length > MAX_CONTACT) {
    errors.contact = `Use at most ${MAX_CONTACT} characters.`;
  }
  return errors;
}

export const plotFormResolver: Resolver<PlotFormValues> = (values) => {
  const errors = validatePlotForm(values);
  const fields = Object.keys(errors) as PlotFormField[];
  if (fields.length === 0) {
    return { values, errors: {} };
  }
  const fieldErrors: FieldErrors<PlotFormValues> = {};
  for (const field of fields) {
    fieldErrors[field] = { type: 'validate', message: errors[field] };
  }
  return { values: {}, errors: fieldErrors };
};

export function toPlotFields(values: PlotFormValues) {
  return {
    price: Number(normalizePrice(values.price)),
    description: values.description.trim(),
    contact: values.contact.trim(),
  };
}

export interface SaveErrorView {
  message: string | null;
  fieldErrors: PlotFieldErrors;
}

export function describeSaveError(error: Error | null): SaveErrorView {
  if (!error) {
    return { message: null, fieldErrors: {} };
  }
  if (!(error instanceof ApiError)) {
    return { message: 'The plot could not be saved. Check your connection.', fieldErrors: {} };
  }
  switch (error.status) {
    case 400:
      return describeInvalidFields(error);
    case 409:
      return {
        message: 'This plot overlaps a plot that is already listed. Redraw it inside free land.',
        fieldErrors: {},
      };
    case 422:
      return { message: `The drawing is not a valid plot: ${error.message}`, fieldErrors: {} };
    default:
      return { message: 'The plot could not be saved. Try again in a moment.', fieldErrors: {} };
  }
}

function describeInvalidFields(error: ApiError): SaveErrorView {
  const fieldErrors: PlotFieldErrors = {};
  const otherMessages: string[] = [];
  for (const { field, message } of error.errors) {
    if ((FIELDS as readonly string[]).includes(field)) {
      fieldErrors[field as PlotFormField] = message;
    } else {
      otherMessages.push(`${field} ${message}`);
    }
  }
  if (otherMessages.length) {
    return { message: otherMessages.join('; '), fieldErrors };
  }
  if (Object.keys(fieldErrors).length) {
    return { message: 'Check the highlighted fields.', fieldErrors };
  }
  return { message: error.message, fieldErrors };
}
