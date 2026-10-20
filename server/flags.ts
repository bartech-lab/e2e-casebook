export const CREATE_CARD_VARIANTS = ['inline', 'dialog'] as const;
export type CreateCardVariant = (typeof CREATE_CARD_VARIANTS)[number];
export type FlagState = { createCard: CreateCardVariant | null; draw: CreateCardVariant | null };

export type Flags = ReturnType<typeof createFlags>;

export function createFlags() {
  const pinned = new Map<string, FlagState>();
  return {
    get: (sandbox: string): FlagState => pinned.get(sandbox) ?? { createCard: null, draw: null },
    set(sandbox: string, state: Partial<FlagState>) {
      pinned.set(sandbox, { ...this.get(sandbox), ...state });
    },
    clear(sandbox: string) {
      pinned.delete(sandbox);
    },
  };
}
