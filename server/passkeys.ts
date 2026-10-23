import type { FastifyInstance, FastifyRequest } from 'fastify';
import { createHash, createPublicKey, randomBytes, verify } from 'node:crypto';

type Params = { sandbox: string };
type Credential = { id: string; name: string; spki: Buffer; alg: number; count: number; uses: number };
type Body = Record<string, unknown>;

const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest();
const origin = (req: FastifyRequest) => `http://${req.headers.host}`;
const rpId = (req: FastifyRequest) => String(req.headers.host).replace(/:\d+$/, '');
const text = (v: unknown) => (typeof v === 'string' ? v : '');

export type Passkeys = ReturnType<typeof createPasskeys>;

export function createPasskeys() {
  const challenges = new Map<string, Set<string>>();
  const creds = new Map<string, Credential[]>();
  const pending = (sandbox: string) => {
    if (!challenges.has(sandbox)) challenges.set(sandbox, new Set());
    return challenges.get(sandbox)!;
  };
  const list = (sandbox: string) => {
    if (!creds.has(sandbox)) creds.set(sandbox, []);
    return creds.get(sandbox)!;
  };
  const challenge = (sandbox: string) => {
    const c = randomBytes(32).toString('base64url');
    pending(sandbox).add(c);
    return c;
  };

  function clientData(req: FastifyRequest<{ Params: Params }>, raw: string, type: string) {
    let data: { type?: string; challenge?: string; origin?: string };
    try {
      data = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    } catch {
      return 'clientDataJSON is not JSON.';
    }
    if (data.type !== type) return 'Wrong ceremony type.';
    if (data.origin !== origin(req)) return 'Wrong origin.';
    if (!data.challenge || !pending(req.params.sandbox).delete(data.challenge)) return 'Unknown or used challenge.';
    return null;
  }

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/passkeys', async (req) => list(req.params.sandbox).map(({ id, name, uses }) => ({ id, name, uses })));

      scope.post<{ Params: Params }>('/passkeys/register/options', async (req) => ({ challenge: challenge(req.params.sandbox), exclude: list(req.params.sandbox).map((c) => c.id) }));

      scope.post<{ Params: Params }>('/passkeys/register', async (req, reply) => {
        const body = (req.body ?? {}) as Body;
        const problem = clientData(req, text(body.clientDataJSON), 'webauthn.create');
        if (problem) return reply.code(400).send({ error: problem });
        if (body.alg !== -7 && body.alg !== -257) return reply.code(400).send({ error: 'Unsupported key type.' });
        const spki = Buffer.from(text(body.publicKey), 'base64url');
        try {
          createPublicKey({ key: spki, format: 'der', type: 'spki' });
        } catch {
          return reply.code(400).send({ error: 'Bad public key.' });
        }
        const all = list(req.params.sandbox);
        const cred = { id: text(body.id), name: `Passkey ${all.length + 1}`, spki, alg: body.alg, count: 0, uses: 0 };
        all.push(cred);
        return { id: cred.id, name: cred.name };
      });

      scope.post<{ Params: Params }>('/passkeys/login/options', async (req) => ({ challenge: challenge(req.params.sandbox) }));

      scope.post<{ Params: Params }>('/passkeys/login', async (req, reply) => {
        const body = (req.body ?? {}) as Body;
        const cred = list(req.params.sandbox).find((c) => c.id === body.id);
        if (!cred) return reply.code(400).send({ error: 'Passkey not recognised.' });
        const raw = text(body.clientDataJSON);
        const problem = clientData(req, raw, 'webauthn.get');
        if (problem) return reply.code(400).send({ error: problem });
        const auth = Buffer.from(text(body.authenticatorData), 'base64url');
        if (auth.length < 37 || !auth.subarray(0, 32).equals(sha256(rpId(req)))) return reply.code(400).send({ error: 'Wrong relying party.' });
        if ((auth[32]! & 0x05) !== 0x05) return reply.code(400).send({ error: 'User not verified.' });
        const count = auth.readUInt32BE(33);
        if ((count !== 0 || cred.count !== 0) && count <= cred.count) return reply.code(400).send({ error: 'Signature counter went back. This passkey may be cloned.' });
        const signed = Buffer.concat([auth, sha256(Buffer.from(raw, 'base64url'))]);
        const key = createPublicKey({ key: cred.spki, format: 'der', type: 'spki' });
        if (!verify('sha256', signed, key, Buffer.from(text(body.signature), 'base64url'))) return reply.code(400).send({ error: 'Bad signature.' });
        cred.count = count;
        cred.uses++;
        return { user: 'ann', passkey: cred.name };
      });

      scope.delete<{ Params: Params & { id: string } }>('/passkeys/:id', async (req) => {
        creds.set(
          req.params.sandbox,
          list(req.params.sandbox).filter((c) => c.id !== req.params.id),
        );
        return { ok: true };
      });
    },
    clear(sandbox: string) {
      challenges.delete(sandbox);
      creds.delete(sandbox);
    },
  };
}
