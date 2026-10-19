import type { WebSocket } from 'ws';
import type { Message } from './store.ts';

export const CLOSE_RESET = 4000;
export const CLOSE_UNKNOWN_SANDBOX = 4404;

type Room = { sockets: Map<WebSocket, string>; broadcastDelayMs: number };

export type Hub = ReturnType<typeof createHub>;

export function createHub() {
  const rooms = new Map<string, Room>();

  function room(sandbox: string) {
    let r = rooms.get(sandbox);
    if (!r) {
      r = { sockets: new Map(), broadcastDelayMs: 0 };
      rooms.set(sandbox, r);
    }
    return r;
  }

  function sendNow(r: Room, payload: string) {
    for (const socket of r.sockets.keys()) {
      if (socket.readyState === socket.OPEN) socket.send(payload);
    }
  }

  return {
    join(sandbox: string, socket: WebSocket, name: string) {
      const r = room(sandbox);
      r.sockets.set(socket, name);
      socket.on('close', () => r.sockets.delete(socket));
    },
    broadcast(sandbox: string, msg: Message) {
      const r = room(sandbox);
      const payload = JSON.stringify({ type: 'msg', ...msg });
      if (r.broadcastDelayMs > 0) setTimeout(() => sendNow(r, payload), r.broadcastDelayMs);
      else sendNow(r, payload);
    },
    setBroadcastDelay(sandbox: string, ms: number) {
      room(sandbox).broadcastDelayMs = ms;
    },
    drop(sandbox: string, target: string) {
      for (const [socket, name] of room(sandbox).sockets) {
        if (target === 'all' || target === name) socket.terminate();
      }
    },
    reset(sandbox: string) {
      const r = room(sandbox);
      r.broadcastDelayMs = 0;
      for (const socket of r.sockets.keys()) {
        if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ type: 'reset' }));
        socket.close(CLOSE_RESET);
      }
    },
    remove(sandbox: string) {
      const r = rooms.get(sandbox);
      if (!r) return;
      for (const socket of r.sockets.keys()) socket.close(CLOSE_UNKNOWN_SANDBOX);
      rooms.delete(sandbox);
    },
  };
}
