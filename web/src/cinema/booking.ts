import { HttpError, json, sendJson } from '../http.ts';

export async function reserveSeat(sandbox: string, seat: string) {
  try {
    await json(await fetch(`/api/s/${sandbox}/cinema/seats`, sendJson('POST', { seat })));
    return `Seat ${seat} reserved.`;
  } catch (error) {
    if (error instanceof HttpError && error.status === 409) return `Seat ${seat} is already taken.`;
    throw error;
  }
}
