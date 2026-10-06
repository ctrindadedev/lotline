const LOCALE = 'pt-BR';

const price = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'BRL' });
const wholeNumber = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const twoDecimals = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const oneDecimal = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const mediumDate = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' });

const SQUARE_METERS_PER_HECTARE = 10_000;

export function formatPrice(value: number): string {
  return price.format(value);
}

export function formatArea(squareMeters: number): string {
  if (squareMeters < SQUARE_METERS_PER_HECTARE) {
    return `${wholeNumber.format(squareMeters)} m²`;
  }
  return `${twoDecimals.format(squareMeters / SQUARE_METERS_PER_HECTARE)} ha`;
}

export function formatPricePerSquareMeter(value: number, squareMeters: number): string {
  return `${price.format(value / squareMeters)}/m²`;
}

export function formatDistance(meters: number): string {
  const rounded = Math.round(meters);
  return rounded < 1000 ? `${rounded} m` : `${oneDecimal.format(meters / 1000)} km`;
}

export function formatDate(isoInstant: string): string {
  return mediumDate.format(new Date(isoInstant));
}
