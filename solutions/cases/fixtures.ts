import {
  test as base,
  expect,
  type APIRequestContext,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
} from '@playwright/test';
import { sharedSandbox } from './common.ts';

export type Card = { id: number; title: string; description: string; status: string; version: number; updatedBy: string };

export type Sandbox = {
  id: string;
  base: string;
  url: string;
  post(name: string, text: string): Promise<void>;
  fault(body: Record<string, unknown>): Promise<void>;
  reset(): Promise<void>;
  seedCards(cards: { title: string; description?: string; status?: string; dueDate?: string | null }[]): Promise<void>;
  card(id: number): Promise<Card>;
  patchCard(id: number, body: Record<string, unknown>, ifVersion?: number): Promise<number>;
  exportJob(id: number): Promise<{ id: number; status: string; progress: number; retryOf: number | null }>;
};

async function ok(res: Awaited<ReturnType<APIRequestContext['post']>>) {
  expect(res.ok(), `${res.url()} -> ${res.status()} ${await res.text()}`).toBe(true);
}

function makeSandbox(request: APIRequestContext, id: string): Sandbox {
  return {
      id,
      base: `/s/${id}`,
      url: `/s/${id}/chat`,
      post: async (name, text) => ok(await request.post(`/api/s/${id}/messages`, { data: { name, text } })),
      fault: async (body) => ok(await request.post(`/__test__/s/${id}/fault`, { data: body })),
      reset: async () => ok(await request.post(`/__test__/s/${id}/reset`)),
      seedCards: async (cards) => ok(await request.post(`/__test__/s/${id}/seed`, { data: { cards } })),
      card: async (cardId) => {
        const res = await request.get(`/api/s/${id}/cards/${cardId}`);
        await ok(res);
        return (await res.json()) as Card;
      },
      patchCard: async (cardId, body, ifVersion) => {
        const headers: Record<string, string> = ifVersion === undefined ? {} : { 'if-match': `"${ifVersion}"` };
        const res = await request.patch(`/api/s/${id}/cards/${cardId}`, { data: body, headers });
        return res.status();
      },
      exportJob: async (jobId) => {
        const res = await request.get(`/api/s/${id}/exports/${jobId}`);
        await ok(res);
        return res.json();
      },
    };
}

export type NewContext = (options?: BrowserContextOptions) => Promise<BrowserContext>;

export const test = base.extend<{ sandbox: Sandbox; shared: Sandbox; newContext: NewContext }>({
  sandbox: async ({ request }, use) => {
    const res = await request.post('/api/sandboxes');
    await ok(res);
    const { id } = (await res.json()) as { id: string };
    await use(makeSandbox(request, id));
  },
  shared: async ({ request }, use) => {
    await use(makeSandbox(request, sharedSandbox()));
  },
  newContext: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];
    await use(async (options) => {
      const context = await browser.newContext(options);
      contexts.push(context);
      return context;
    });
    await Promise.all(contexts.map((context) => context.close()));
  },
});

export { expect };
