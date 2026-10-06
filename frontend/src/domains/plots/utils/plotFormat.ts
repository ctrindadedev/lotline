const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BRL' });
const wholeNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const hectares = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const listedDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

const SQUARE_METERS_PER_HECTARE = 10_000;

export function formatPrice(value: number): string {
  return price.format(value);
}

export function formatArea(squareMeters: number): string {
  if (squareMeters < SQUARE_METERS_PER_HECTARE) {
    return `${wholeNumber.format(squareMeters)} m²`;
  }
  return `${hectares.format(squareMeters / SQUARE_METERS_PER_HECTARE)} ha`;
}

export function formatPricePerSquareMeter(value: number, squareMeters: number): string {
  return `${price.format(value / squareMeters)}/m²`;
}

export function formatListedDate(isoInstant: string): string {
  return listedDate.format(new Date(isoInstant));
}
