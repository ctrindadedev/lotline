import { describe, expect, it } from 'vitest';
import {
  EMPTY_SEARCH_FILTERS,
  searchFiltersResolver,
  toSearchFilters,
  validateSearchFilters,
} from './searchFilters';
import { messages } from '../../../shared/i18n/messages';

const options = { fields: {}, shouldUseNativeValidation: false };

describe('validateSearchFilters', () => {
  it('accepts empty filters and numbers of zero or more, with a comma or a dot', () => {
    expect(validateSearchFilters(EMPTY_SEARCH_FILTERS)).toEqual({});
    expect(
      validateSearchFilters({ minPrice: '0', maxPrice: '150000,5', minArea: '500', maxArea: '' }),
    ).toEqual({});
  });

  it('rejects anything that is not a non-negative number', () => {
    expect(
      validateSearchFilters({ ...EMPTY_SEARCH_FILTERS, minPrice: '-1', maxArea: 'abc' }),
    ).toEqual({
      minPrice: messages.searchFilters.number,
      maxArea: messages.searchFilters.number,
    });
  });

  it.each(['200,000', '1,500', '1.234,56', '10.555'])(
    'rejects %j instead of reading a thousands separator as a decimal point',
    (maxPrice) => {
      expect(validateSearchFilters({ ...EMPTY_SEARCH_FILTERS, maxPrice }).maxPrice).toBe(
        messages.searchFilters.number,
      );
    },
  );

  it.each([
    ['150000,5', 150000.5],
    ['1500,50', 1500.5],
    ['1500.75', 1500.75],
  ])('reads %j as %d', (maxPrice, expected) => {
    expect(validateSearchFilters({ ...EMPTY_SEARCH_FILTERS, maxPrice })).toEqual({});
    expect(toSearchFilters({ ...EMPTY_SEARCH_FILTERS, maxPrice }).maxPrice).toBe(expected);
  });

  it('rejects a maximum below its minimum', () => {
    expect(
      validateSearchFilters({ minPrice: '200', maxPrice: '100', minArea: '50', maxArea: '10' }),
    ).toEqual({
      maxPrice: messages.searchFilters.maxBelowMin,
      maxArea: messages.searchFilters.maxBelowMin,
    });
  });
});

describe('searchFiltersResolver', () => {
  it('passes valid filters and reports invalid ones per field', async () => {
    expect(await searchFiltersResolver(EMPTY_SEARCH_FILTERS, undefined, options)).toEqual({
      values: EMPTY_SEARCH_FILTERS,
      errors: {},
    });
    expect(
      await searchFiltersResolver({ ...EMPTY_SEARCH_FILTERS, minArea: 'x' }, undefined, options),
    ).toEqual({
      values: {},
      errors: {
        minArea: {
          type: 'validate',
          message: messages.searchFilters.number,
        },
      },
    });
  });
});

describe('toSearchFilters', () => {
  it('sends only the filters that are filled in, area in square metres', () => {
    expect(
      toSearchFilters({ minPrice: '', maxPrice: '150000,5', minArea: '500', maxArea: ' ' }),
    ).toEqual({
      minPrice: undefined,
      maxPrice: 150000.5,
      minAreaSquareMeters: 500,
      maxAreaSquareMeters: undefined,
    });
  });
});
