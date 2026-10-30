import type { Bug, Edit } from '../../scripts/score-lib.ts';

export const baseline: Edit[] = [
  {
    file: "server/shop.ts",
    find: "  // Discount comes off the gross amount, after VAT (pricing rules, 2025).\n  const vat = roundHalfUp(subtotal * VAT_PERCENT);",
    replace: "  const vat = roundHalfUp((subtotal - discount) * VAT_PERCENT);",
  },
];

export const bugs: Bug[] = [
  {
    name: "VAT rounded down",
    edits: [{ file: "server/shop.ts", find: "Math.floor((hundredths + 50) / 100)", replace: "Math.floor(hundredths / 100)" }],
  },
  {
    name: "Code is case-sensitive",
    edits: [{ file: "server/shop.ts", find: "code.trim().toUpperCase()", replace: "code.trim()" }],
  },
  {
    name: "Code keeps surrounding spaces",
    edits: [{ file: "server/shop.ts", find: "code.trim().toUpperCase()", replace: "code.toUpperCase()" }],
  },
  {
    name: "Discount takes the subtotal below zero",
    edits: [{ file: "server/shop.ts", find: "Math.min(DISCOUNT, subtotal)", replace: "DISCOUNT" }],
  },
  {
    name: "Order ignores the code",
    edits: [{ file: "server/shop.ts", find: "const q = quote(cart);", replace: "const q = quote({ ...cart, code: null });" }],
  },
];
