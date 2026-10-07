import { describe, expect, it } from 'vitest';
import { ApiError } from '../../../shared/lib/http';
import {
  describeSaveError,
  plotFormResolver,
  toPlotFields,
  validatePlotForm,
  type PlotFormValues,
} from './plotForm';
import { messages } from '../../../shared/i18n/messages';

const VALID: PlotFormValues = {
  price: '150000.50',
  description: 'Corner plot',
  contact: 'seller@example.com',
};

describe('validatePlotForm', () => {
  it('accepts a complete form, with a comma or a dot as decimal separator', () => {
    expect(validatePlotForm(VALID)).toEqual({});
    expect(validatePlotForm({ ...VALID, price: ' 150000,5 ' })).toEqual({});
  });

  it.each(['', '0', '-10', 'abc', '1.234', '1234567890123', '200,000', '1.234,56'])(
    'rejects the price %j',
    (price) => {
      expect(validatePlotForm({ ...VALID, price }).price).toBeDefined();
    },
  );

  it('requires a description and a contact within the API limits', () => {
    expect(validatePlotForm({ ...VALID, description: '  ', contact: '' })).toEqual({
      description: messages.plotForm.errors.descriptionRequired,
      contact: messages.plotForm.errors.contactRequired,
    });
    expect(
      validatePlotForm({ ...VALID, description: 'x'.repeat(2001), contact: 'x'.repeat(256) }),
    ).toEqual({
      description: messages.plotForm.errors.descriptionTooLong(2000),
      contact: messages.plotForm.errors.contactTooLong(255),
    });
  });
});

describe('plotFormResolver', () => {
  const options = { fields: {}, shouldUseNativeValidation: false };

  it('passes valid values through', async () => {
    expect(await plotFormResolver(VALID, undefined, options)).toEqual({
      values: VALID,
      errors: {},
    });
  });

  it('reports each invalid field in the shape react-hook-form expects', async () => {
    expect(await plotFormResolver({ ...VALID, price: '0' }, undefined, options)).toEqual({
      values: {},
      errors: {
        price: {
          type: 'validate',
          message: messages.plotForm.errors.price,
        },
      },
    });
  });
});

describe('toPlotFields', () => {
  it('sends the price as a number and trims the text', () => {
    expect(
      toPlotFields({ price: '150000,5', description: ' Corner ', contact: ' a@b.c ' }),
    ).toEqual({ price: 150000.5, description: 'Corner', contact: 'a@b.c' });
  });
});

describe('describeSaveError', () => {
  const errors = messages.plotForm.saveErrors;

  it('has nothing to say without an error', () => {
    expect(describeSaveError(null)).toEqual({ message: null, detail: null, fieldErrors: {} });
  });

  it("puts field errors on their fields in the user's language, and keeps the rest as detail", () => {
    const error = new ApiError(400, 'Bad Request', 'One or more fields are invalid', [
      { field: 'price', message: 'must be greater than 0' },
      { field: 'boundary', message: 'must not be null' },
    ]);

    expect(describeSaveError(error)).toEqual({
      message: errors.rejected,
      detail: 'boundary must not be null',
      fieldErrors: { price: messages.plotForm.errors.price },
    });
  });

  it('points at the fields when every 400 error belongs to one', () => {
    const error = new ApiError(400, 'Bad Request', 'invalid', [
      { field: 'description', message: 'size must be between 0 and 2000' },
      { field: 'contact', message: 'must not be blank' },
    ]);

    expect(describeSaveError(error)).toEqual({
      message: errors.highlighted,
      detail: null,
      fieldErrors: {
        description: messages.plotForm.errors.descriptionRejected,
        contact: messages.plotForm.errors.contactRejected,
      },
    });
  });

  it("keeps the API's wording only as detail when a 400 names no field", () => {
    const error = new ApiError(400, 'Bad Request', 'Failed to read request');

    expect(describeSaveError(error)).toEqual({
      message: errors.rejected,
      detail: 'Failed to read request',
      fieldErrors: {},
    });
  });

  it('explains an overlap without the ids the API sends', () => {
    const error = new ApiError(409, 'Conflict', 'The boundary overlaps existing plots: 0199...');

    expect(describeSaveError(error)).toEqual({
      message: errors.overlap,
      detail: null,
      fieldErrors: {},
    });
  });

  it('explains an invalid drawing, with the reason as detail', () => {
    const error = new ApiError(422, 'Unprocessable', 'Self-intersection at (-47, -22)');

    expect(describeSaveError(error)).toEqual({
      message: errors.invalidDrawing,
      detail: 'Self-intersection at (-47, -22)',
      fieldErrors: {},
    });
  });

  it('says the session ended for a 401 or a refused CSRF token', () => {
    expect(describeSaveError(new ApiError(401, 'Unauthorized', 'x')).message).toBe(
      errors.sessionExpired,
    );
    expect(
      describeSaveError(new ApiError(403, 'Forbidden', 'Missing or invalid CSRF token')).message,
    ).toBe(errors.sessionExpired);
  });

  it('falls back to a generic message for server and network failures', () => {
    expect(describeSaveError(new ApiError(500, 'Error', 'boom')).message).toBe(errors.server);
    expect(describeSaveError(new TypeError('Failed to fetch')).message).toBe(errors.network);
  });
});
