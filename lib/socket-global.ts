import type { Server } from "socket.io";

type GlobalIo = typeof globalThis & { __io?: Server };

export function getSocketServer(): Server | undefined {
  return (globalThis as GlobalIo).__io;
}

export function emitToJobsRoom(event: string, payload: unknown) {
  getSocketServer()?.to("jobs").emit(event, payload);
}

/** Targeted urgent alerts (sockets must join `user:${userId}`). */
export function emitJobEmergencyToUsers(userIds: string[], payload: unknown) {
  const io = getSocketServer();
  if (!io || userIds.length === 0) return;
  for (const id of userIds) {
    io.to(`user:${id}`).emit("job:emergency", payload);
  }
}
