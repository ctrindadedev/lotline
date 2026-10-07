import type { FieldErrors, Resolver } from 'react-hook-form';
import { messages } from '../../../shared/i18n/messages';
import { ApiError, isSessionLost } from '../../../shared/lib/http';

export interface PlotFormValues {
  price: string;
  description: string;
  contact: string;
}

export type PlotFormField = keyof PlotFormValues;

export type PlotFieldErrors = Partial<Record<PlotFormField, string>>;

export const EMPTY_PLOT_FORM: PlotFormValues = { price: '', description: '', contact: '' };

const text = messages.plotForm;

/** What to show for a field the API rejected: the same wording as the form's own checks. */
const REJECTED_FIELD: Record<PlotFormField, string> = {
  price: text.errors.price,
  description: text.errors.descriptionRejected,
  contact: text.errors.contactRejected,
};
const PRICE_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;
const MAX_DESCRIPTION = 2000;
const MAX_CONTACT = 255;

function normalizePrice(price: string): string {
  return price.trim().replace(',', '.');
}

/** The price typed so far, or null while it is not a valid price. */
export function parsePrice(value: string): number | null {
  const price = normalizePrice(value);
  return PRICE_PATTERN.test(price) && Number(price) > 0 ? Number(price) : null;
}

/** Mirrors the API's rules, so most mistakes are caught before the request. */
export function validatePlotForm(values: PlotFormValues): PlotFieldErrors {
  const errors: PlotFieldErrors = {};
  if (parsePrice(values.price) === null) {
    errors.price = text.errors.price;
  }
  if (!values.description.trim()) {
    errors.description = text.errors.descriptionRequired;
  } else if (values.description.trim().length > MAX_DESCRIPTION) {
    errors.description = text.errors.descriptionTooLong(MAX_DESCRIPTION);
  }
  if (!values.contact.trim()) {
    errors.contact = text.errors.contactRequired;
  } else if (values.contact.trim().length > MAX_CONTACT) {
    errors.contact = text.errors.contactTooLong(MAX_CONTACT);
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
  /** What went wrong, in the user's language. */
  message: string | null;
  /** The API's own wording, shown only as a technical detail. */
  detail: string | null;
  fieldErrors: PlotFieldErrors;
}

const NO_ERROR: SaveErrorView = { message: null, detail: null, fieldErrors: {} };

export function describeSaveError(error: Error | null): SaveErrorView {
  if (!error) {
    return NO_ERROR;
  }
  if (!(error instanceof ApiError)) {
    return { ...NO_ERROR, message: text.saveErrors.network };
  }
  if (isSessionLost(error)) {
    return { ...NO_ERROR, message: text.saveErrors.sessionExpired };
  }
  switch (error.status) {
    case 400:
      return describeInvalidFields(error);
    case 409:
      return { ...NO_ERROR, message: text.saveErrors.overlap };
    case 422:
      return { ...NO_ERROR, message: text.saveErrors.invalidDrawing, detail: error.message };
    default:
      return { ...NO_ERROR, message: text.saveErrors.server };
  }
}

function describeInvalidFields(error: ApiError): SaveErrorView {
  const fieldErrors: PlotFieldErrors = {};
  const otherMessages: string[] = [];
  for (const { field, message } of error.errors) {
    if (field in REJECTED_FIELD) {
      fieldErrors[field as PlotFormField] = REJECTED_FIELD[field as PlotFormField];
    } else {
      otherMessages.push(`${field} ${message}`);
    }
  }
  if (otherMessages.length) {
    return { message: text.saveErrors.rejected, detail: otherMessages.join('; '), fieldErrors };
  }
  if (Object.keys(fieldErrors).length) {
    return { message: text.saveErrors.highlighted, detail: null, fieldErrors };
  }
  return { message: text.saveErrors.rejected, detail: error.message, fieldErrors };
}
