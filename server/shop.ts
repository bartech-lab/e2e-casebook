import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

export const PRODUCTS = [
  { sku: 'notebook', name: 'Notebook', price: 1250 },
  { sku: 'pen', name: 'Pen', price: 399 },
  { sku: 'backpack', name: 'Backpack', price: 8900 },
] as const;

export const DISCOUNT_CODE = 'SAVE10';
const DISCOUNT = 1000;
const VAT_PERCENT = 23;
const INSURANCE = 499;
const MAX_QTY = 99;
const MIN_PEOPLE = 2;
const MAX_PEOPLE = 8;

type Cart = { items: Map<string, number>; code: string | null; insurance: boolean };
export type Quote = { subtotal: number; discount: number; vat: number; insurance: number; total: number };
type Order = { id: number; lines: ReturnType<typeof lines>; code: string | null; quote: Quote; placedAt: string };

const roundHalfUp = (hundredths: number) => Math.floor((hundredths + 50) / 100);

export function quote(cart: Cart): Quote {
  let subtotal = 0;
  for (const p of PRODUCTS) subtotal += p.price * (cart.items.get(p.sku) ?? 0);
  const discount = cart.code ? Math.min(DISCOUNT, subtotal) : 0;
  // Discount comes off the gross amount, after VAT (pricing rules, 2025).
  const vat = roundHalfUp(subtotal * VAT_PERCENT);
  const insurance = cart.insurance ? INSURANCE : 0;
  return { subtotal, discount, vat, insurance, total: subtotal - discount + vat + insurance };
}

export function splitShares(total: number, people: number) {
  const base = Math.floor(total / people);
  const extra = total - base * people;
  return Array.from({ length: people }, (_, i) => base + (i < extra ? 1 : 0));
}

function lines(cart: Cart) {
  return PRODUCTS.filter((p) => cart.items.has(p.sku)).map((p) => {
    const qty = cart.items.get(p.sku)!;
    return { sku: p.sku, name: p.name, price: p.price, qty, lineTotal: p.price * qty };
  });
}

export type Shop = ReturnType<typeof createShop>;

export function createShop() {
  const carts = new Map<string, Cart>();
  const orders = new Map<string, Order[]>();

  const cartOf = (sandbox: string) => {
    let cart = carts.get(sandbox);
    if (!cart) carts.set(sandbox, (cart = { items: new Map(), code: null, insurance: false }));
    return cart;
  };
  const view = (cart: Cart) => ({ lines: lines(cart), code: cart.code, insurance: cart.insurance, quote: quote(cart) });

  function register(scope: FastifyInstance) {
    scope.get('/products', async () => ({ products: PRODUCTS }));

    scope.get<{ Params: Params }>('/cart', async (req) => view(cartOf(req.params.sandbox)));

    scope.put<{ Params: Params & { sku: string }; Body: { qty?: unknown } }>('/cart/items/:sku', async (req, reply) => {
      if (!PRODUCTS.some((p) => p.sku === req.params.sku)) return reply.code(404).send({ error: 'unknown product' });
      const qty = req.body?.qty;
      if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 0 || qty > MAX_QTY) {
        return reply.code(400).send({ error: `qty must be a whole number from 0 to ${MAX_QTY}` });
      }
      const cart = cartOf(req.params.sandbox);
      if (qty === 0) cart.items.delete(req.params.sku);
      else cart.items.set(req.params.sku, qty);
      return view(cart);
    });

    scope.put<{ Params: Params; Body: { code?: unknown } }>('/cart/code', async (req, reply) => {
      const code = req.body?.code;
      if (code !== null && typeof code !== 'string') return reply.code(400).send({ error: 'code must be a string or null' });
      const normalized = code === null ? null : code.trim().toUpperCase();
      if (normalized !== null && normalized !== DISCOUNT_CODE) return reply.code(400).send({ error: 'unknown code' });
      const cart = cartOf(req.params.sandbox);
      cart.code = normalized;
      return view(cart);
    });

    scope.put<{ Params: Params; Body: { on?: unknown } }>('/cart/insurance', async (req, reply) => {
      if (typeof req.body?.on !== 'boolean') return reply.code(400).send({ error: 'on must be true or false' });
      const cart = cartOf(req.params.sandbox);
      cart.insurance = req.body.on;
      return view(cart);
    });

    scope.post<{ Params: Params }>('/orders', async (req, reply) => {
      const { sandbox } = req.params;
      const cart = cartOf(sandbox);
      if (!cart.items.size) return reply.code(400).send({ error: 'the cart is empty' });
      const list = orders.get(sandbox) ?? [];
      const q = quote(cart);
      const order: Order = { id: list.length + 1, lines: lines(cart), code: cart.code, quote: q, placedAt: new Date().toISOString() };
      orders.set(sandbox, [...list, order]);
      carts.delete(sandbox);
      return reply.code(201).send(order);
    });

    scope.get<{ Params: Params }>('/orders', async (req) => ({ orders: orders.get(req.params.sandbox) ?? [] }));

    scope.get<{ Params: Params & { order: string }; Querystring: { people?: string } }>('/orders/:order/split', async (req, reply) => {
      const order = (orders.get(req.params.sandbox) ?? []).find((o) => String(o.id) === req.params.order);
      if (!order) return reply.code(404).send({ error: 'unknown order' });
      const people = Number(req.query.people);
      if (!Number.isInteger(people) || people < MIN_PEOPLE || people > MAX_PEOPLE) {
        return reply.code(400).send({ error: `people must be a whole number from ${MIN_PEOPLE} to ${MAX_PEOPLE}` });
      }
      return { order: order.id, total: order.quote.total, people, shares: splitShares(order.quote.total, people) };
    });
  }

  return {
    register,
    clear(sandbox: string) {
      carts.delete(sandbox);
      orders.delete(sandbox);
    },
  };
}
