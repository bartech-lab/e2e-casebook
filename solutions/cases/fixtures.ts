import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test';

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

export const test = base.extend<{ sandbox: Sandbox; shared: Sandbox }>({
  sandbox: async ({ request }, use) => {
    const res = await request.post('/api/sandboxes');
    await ok(res);
    const { id } = (await res.json()) as { id: string };
    await use(makeSandbox(request, id));
  },
  shared: async ({ request }, use) => {
    await use(makeSandbox(request, sharedSandbox()));
  },
});

export { expect };

export async function joinChat(page: Page, sandbox: Sandbox, name: string) {
  await page.goto(sandbox.url);
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByTestId('connection')).toHaveAttribute('data-state', 'open');
}

export async function send(page: Page, text: string) {
  await page.getByLabel('Message', { exact: true }).fill(text);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('');
}

export const messages = (page: Page) => page.getByRole('list', { name: 'Messages' }).getByRole('listitem');

export async function join(page: Page, sandbox: Sandbox, name: string, path: string) {
  await page.goto(`${sandbox.base}/${path}`);
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Join' }).click();
}

export const column = (page: Page, name: 'To do' | 'Doing' | 'Done') =>
  page.getByRole('region', { name }).getByRole('listitem');

export async function moveCard(page: Page, title: string, to: 'To do' | 'Doing' | 'Done') {
  await page.getByRole('button', { name: `Move “${title}” to ${to}` }).click();
}

export function sharedSandbox(): Sandbox['id'] {
  const id = process.env.SHARED_SANDBOX;
  if (!id) throw new Error('SHARED_SANDBOX is not set; global-setup.ts creates it');
  return id;
}
