import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Country = 'PL' | 'US' | 'UK';
type Address = { country: Country; postcode: string; state?: string };

export const STATES = ['CA', 'NY', 'TX'];
const POSTCODE: Record<Country, RegExp> = {
  PL: /^\d{2}-\d{3}$/,
  US: /^\d{5}(-\d{4})?$/,
  UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
};

export function checkAddress(body: unknown): Address | string {
  const { country, postcode, state } = (body ?? {}) as Record<string, unknown>;
  if (country !== 'PL' && country !== 'US' && country !== 'UK') return 'country must be PL, US or UK';
  if (typeof postcode !== 'string' || !POSTCODE[country].test(postcode.trim())) return `postcode is not valid for ${country}`;
  if (country === 'US' && (typeof state !== 'string' || !STATES.includes(state))) return 'state is required for US';
  if (country !== 'US' && state !== undefined) return `state is only for US`;
  const code = country === 'UK' ? postcode.trim().toUpperCase().replace(/^(.+?)\s*(\d[A-Z]{2})$/, '$1 $2') : postcode.trim();
  return country === 'US' ? { country, postcode: code, state: state as string } : { country, postcode: code };
}

export type Shipping = ReturnType<typeof createShipping>;

export function createShipping() {
  const saved = new Map<string, Address>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/shipping', async (req) => ({ address: saved.get(req.params.sandbox) ?? null }));

      scope.put<{ Params: Params }>('/shipping', async (req, reply) => {
        const address = checkAddress(req.body);
        if (typeof address === 'string') return reply.code(400).send({ error: address });
        saved.set(req.params.sandbox, address);
        return { address };
      });
    },
    clear(sandbox: string) {
      saved.delete(sandbox);
    },
  };
}
