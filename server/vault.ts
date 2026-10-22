import { createHmac, randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Vault = { secret: string; enabled: boolean; usedSteps: Set<number>; failures: number; lockedUntil: number };

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_MS = 30_000;
const MAX_FAILURES = 5;
const LOCK_MS = 60_000;
export const VAULT_NOTES = ['Door code: 4711', 'Wi-Fi: correct-horse-battery', 'Locker: 18'];

export function base32Decode(text: string): Buffer {
  let bits = '';
  for (const ch of text.replace(/=+$/, '').toUpperCase()) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) throw new Error('not base32');
    bits += v.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function totp(secret: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const mac = createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const offset = mac[mac.length - 1]! & 0x0f;
  const value = (mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(value).padStart(6, '0');
}

export type Vaults = ReturnType<typeof createVaults>;

export function createVaults() {
  const vaults = new Map<string, Vault>();
  const clocks = new Map<string, number>();
  const now = (sandbox: string) => clocks.get(sandbox) ?? Date.now();

  function check(sandbox: string, v: Vault, code: unknown): 'ok' | 'wrong' | 'used' | 'locked' {
    const t = now(sandbox);
    if (t < v.lockedUntil) return 'locked';
    const step = Math.floor(t / STEP_MS);
    const match = typeof code === 'string' ? [step - 1, step, step + 1].find((s) => totp(v.secret, s) === code.trim()) : undefined;
    if (match === undefined) {
      if (++v.failures >= MAX_FAILURES) {
        v.failures = 0;
        v.lockedUntil = t + LOCK_MS;
      }
      return 'wrong';
    }
    if (v.usedSteps.has(match)) return 'used';
    v.usedSteps.add(match);
    v.failures = 0;
    return 'ok';
  }

  const answer = { wrong: [401, 'Wrong code.'], used: [409, 'That code was already used. Wait for a new one.'], locked: [429, 'Too many tries. Try again in 1 minute.'] } as const;

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/vault', async (req) => ({ enabled: vaults.get(req.params.sandbox)?.enabled ?? false }));

      scope.post<{ Params: Params }>('/vault/setup', async (req, reply) => {
        if (vaults.get(req.params.sandbox)?.enabled) return reply.code(409).send({ error: 'already on' });
        const secret = Array.from(randomBytes(16), (b) => ALPHABET[b % 32]).join('');
        vaults.set(req.params.sandbox, { secret, enabled: false, usedSteps: new Set(), failures: 0, lockedUntil: 0 });
        return { secret };
      });

      for (const [path, enabled] of [['/vault/enable', false], ['/vault/unlock', true]] as const) {
        scope.post<{ Params: Params }>(path, async (req, reply) => {
          const v = vaults.get(req.params.sandbox);
          if (!v || v.enabled !== enabled) return reply.code(409).send({ error: enabled ? 'two-step verification is off' : 'start the setup first' });
          const result = check(req.params.sandbox, v, (req.body as { code?: unknown } | undefined)?.code);
          if (result !== 'ok') return reply.code(answer[result][0]).send({ error: answer[result][1] });
          v.enabled = true;
          return enabled ? { notes: VAULT_NOTES } : { enabled: true };
        });
      }
    },
    currentCode(sandbox: string) {
      const v = vaults.get(sandbox);
      return v ? totp(v.secret, Math.floor(now(sandbox) / STEP_MS)) : null;
    },
    setClock(sandbox: string, ms: number | null) {
      if (ms === null) clocks.delete(sandbox);
      else clocks.set(sandbox, ms);
    },
    clear(sandbox: string) {
      vaults.delete(sandbox);
      clocks.delete(sandbox);
    },
  };
}
