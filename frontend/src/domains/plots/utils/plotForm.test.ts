import { describe, expect, it } from 'vitest';
import { ApiError } from '../../../shared/lib/http';
import {
  describeSaveError,
  plotFormResolver,
  toPlotFields,
  validatePlotForm,
  type PlotFormValues,
} from './plotForm';

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
      description: 'Describe the plot.',
      contact: 'Enter a phone number or an email.',
    });
    expect(
      validatePlotForm({ ...VALID, description: 'x'.repeat(2001), contact: 'x'.repeat(256) }),
    ).toEqual({
      description: 'Use at most 2000 characters.',
      contact: 'Use at most 255 characters.',
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
          message:
            'Enter a price above 0: digits only, up to 2 decimals (no thousands separators).',
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
  it('has nothing to say without an error', () => {
    expect(describeSaveError(null)).toEqual({ message: null, fieldErrors: {} });
  });

  it('puts field errors on their fields and the rest in the message', () => {
    const error = new ApiError(400, 'Bad Request', 'One or more fields are invalid', [
      { field: 'price', message: 'must be greater than 0' },
      { field: 'boundary', message: 'must not be null' },
    ]);

    expect(describeSaveError(error)).toEqual({
      message: 'boundary must not be null',
      fieldErrors: { price: 'must be greater than 0' },
    });
  });

  it('points at the fields when every 400 error belongs to one', () => {
    const error = new ApiError(400, 'Bad Request', 'invalid', [
      { field: 'contact', message: 'must not be blank' },
    ]);

    expect(describeSaveError(error).message).toBe('Check the highlighted fields.');
  });

  it("shows the API's detail when a 400 names no field", () => {
    const error = new ApiError(400, 'Bad Request', 'Failed to read request');

    expect(describeSaveError(error)).toEqual({
      message: 'Failed to read request',
      fieldErrors: {},
    });
  });

  it('explains an overlap without the ids the API sends', () => {
    const error = new ApiError(409, 'Conflict', 'The boundary overlaps existing plots: 0199...');

    expect(describeSaveError(error).message).toMatch(/^This plot overlaps a plot/);
  });

  it('shows why the drawing is invalid', () => {
    const error = new ApiError(422, 'Unprocessable', 'Self-intersection at (-47, -22)');

    expect(describeSaveError(error).message).toBe(
      'The drawing is not a valid plot: Self-intersection at (-47, -22)',
    );
  });

  it('falls back to a generic message for server and network failures', () => {
    expect(describeSaveError(new ApiError(500, 'Error', 'boom')).message).toMatch(/Try again/);
    expect(describeSaveError(new TypeError('Failed to fetch')).message).toMatch(/connection/);
  });
});
