export type Locker = { id: string; street: string; metres: number; full: boolean };

export const LOCKERS: Locker[] = [
  { id: 'KRA01M', street: 'Długa 5', metres: 350, full: false },
  { id: 'KRA07A', street: 'Rynek Główny 1', metres: 120, full: true },
  { id: 'KRA12B', street: 'Karmelicka 20', metres: 800, full: false },
  { id: 'KRA03C', street: 'Basztowa 2', metres: 90, full: false },
  { id: 'KRA22D', street: 'Lubicz 9', metres: 1500, full: true },
  { id: 'KRA15E', street: 'Dietla 40', metres: 2400, full: false },
];

/**
 * Lockers to offer at checkout, nearest first.
 * Full lockers are left out: the courier cannot use them, so there is no point showing them.
 */
export function lockerList(lockers: Locker[]): Locker[] {
  const byDistance = [...lockers].sort((a, b) => a.metres - b.metres);
  return [...byDistance.filter((l) => !l.full), ...byDistance.filter((l) => l.full)];
}

// Distances are always shown in metres; the map rounds them to 10 m.
export function distance(metres: number): string {
  return metres < 1000 ? `${metres} m` : `${(metres / 1000).toFixed(1)} km`;
}
