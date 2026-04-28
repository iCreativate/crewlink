import type { Server } from "socket.io";

declare global {
  var __io: Server | undefined;
}

export {};
