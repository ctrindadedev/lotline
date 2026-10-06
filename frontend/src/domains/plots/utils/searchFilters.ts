import type { FieldErrors, Resolver } from 'react-hook-form';
import { messages } from '../../../shared/i18n/messages';
import type { RadiusSearch } from '../types';

export interface SearchFilterValues {
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
}

type FilterField = keyof SearchFilterValues;

export type SearchFilters = Pick<
  RadiusSearch,
  'minPrice' | 'maxPrice' | 'minAreaSquareMeters' | 'maxAreaSquareMeters'
>;

export const EMPTY_SEARCH_FILTERS: SearchFilterValues = {
  minPrice: '',
  maxPrice: '',
  minArea: '',
  maxArea: '',
};

// At most 2 decimals, so a thousands separator ("200,000") is rejected, never read as 200.
const NUMBER_PATTERN = /^\d+(\.\d{1,2})?$/;

function parse(value: string): number | undefined | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return undefined;
  }
  return NUMBER_PATTERN.test(normalized) ? Number(normalized) : null;
}

/** Each filter is optional; a filled one is a number of zero or more, min never above max. */
export function validateSearchFilters(
  values: SearchFilterValues,
): Partial<Record<FilterField, string>> {
  const errors: Partial<Record<FilterField, string>> = {};
  for (const field of Object.keys(values) as FilterField[]) {
    if (parse(values[field]) === null) {
      errors[field] = messages.searchFilters.number;
    }
  }
  for (const [min, max] of [
    ['minPrice', 'maxPrice'],
    ['minArea', 'maxArea'],
  ] as const) {
    const low = parse(values[min]);
    const high = parse(values[max]);
    if (typeof low === 'number' && typeof high === 'number' && low > high) {
      errors[max] = messages.searchFilters.maxBelowMin;
    }
  }
  return errors;
}

export const searchFiltersResolver: Resolver<SearchFilterValues> = (values) => {
  const errors = validateSearchFilters(values);
  const fields = Object.keys(errors) as FilterField[];
  if (fields.length === 0) {
    return { values, errors: {} };
  }
  const fieldErrors: FieldErrors<SearchFilterValues> = {};
  for (const field of fields) {
    fieldErrors[field] = { type: 'validate', message: errors[field] };
  }
  return { values: {}, errors: fieldErrors };
};

/** The API parameters for the filters that are filled in; empty ones are left out. */
export function toSearchFilters(values: SearchFilterValues): SearchFilters {
  return {
    minPrice: parse(values.minPrice) ?? undefined,
    maxPrice: parse(values.maxPrice) ?? undefined,
    minAreaSquareMeters: parse(values.minArea) ?? undefined,
    maxAreaSquareMeters: parse(values.maxArea) ?? undefined,
  };
}
