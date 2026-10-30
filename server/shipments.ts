import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Shipment = { tracking: string; to: string; status: string; history: string[] };

const SHIPMENTS: Shipment[] = [
  { tracking: '1234567890123456789', to: 'Anna Kowalska, Kraków', status: 'Delivered', history: ['Sent from Łódź', 'In Kraków depot', 'Delivered'] },
  { tracking: '1234567890123456800', to: 'Marek Nowak, Gdańsk', status: 'Waiting at the locker', history: ['Sent from Łódź', 'In the locker GDA-12'] },
  { tracking: '9007199254740993', to: 'Ewa Lis, Poznań', status: 'On the way', history: ['Sent from Warsaw'] },
  { tracking: '555', to: 'Piotr Zając, Lublin', status: 'Returned to sender', history: ['Sent from Warsaw', 'Nobody home', 'Returned'] },
];

const listJson = () =>
  `{"shipments":[${SHIPMENTS.map((s) => `{"id":${s.tracking},"id_str":"${s.tracking}","to":${JSON.stringify(s.to)},"status":${JSON.stringify(s.status)}}`).join(',')}]}`;
const oneJson = (s: Shipment) =>
  `{"id":${s.tracking},"id_str":"${s.tracking}","to":${JSON.stringify(s.to)},"status":${JSON.stringify(s.status)},"history":${JSON.stringify(s.history)}}`;

export function registerShipments(scope: FastifyInstance) {
  scope.get<{ Params: Params }>('/shipments', async (_req, reply) => reply.type('application/json').send(listJson()));
  scope.get<{ Params: Params & { tracking: string } }>('/shipments/:tracking', async (req, reply) => {
    const s = SHIPMENTS.find((x) => x.tracking === req.params.tracking);
    if (!s) return reply.code(404).send({ error: 'Shipment not found' });
    return reply.type('application/json').send(oneJson(s));
  });
}
