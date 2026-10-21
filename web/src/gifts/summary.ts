export const WRAP = 500;

export type Summary = { value: number; wrapping: number; total: number };

export function summarize(amount: number, quantity: number, wrap: boolean): Summary {
  const value = amount * quantity;
  const wrapping = wrap && quantity < 5 ? WRAP * quantity : 0;
  return { value, wrapping, total: value + wrapping };
}
