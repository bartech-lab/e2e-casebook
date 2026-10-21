export const CATEGORIES = ['Food', 'Transport', 'Fun'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Totals = Record<Category, number>;

export const EMPTY: Totals = { Food: 0, Transport: 0, Fun: 0 };

export function addTo(totals: Totals, category: Category, grosze: number): Totals {
  const c = category;
  return { ...totals, [c]: totals[c] + grosze };
}

export function removeFrom(totals: Totals, category: Category, grosze: number): Totals {
  return { ...totals, [category]: totals[category] - grosze };
}

export function bars(totals: Totals) {
  return CATEGORIES.map((category) => ({ category, grosze: totals[category] }));
}
