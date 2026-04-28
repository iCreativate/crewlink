/**
 * Custom HTTP server so Socket.io shares the same process as Next.js (real-time job feed).
 * Run: `npm run dev` or `npm start` (after `npm run build`).
 */
import http from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = http.createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  void handle(req, res, parsedUrl);
});

const io = new Server(server, {
  path: "/socket.io/",
  addTrailingSlash: false,
  cors: { origin: true, credentials: true },
});

globalThis.__io = io;

io.on("connection", (socket) => {
  void socket.join("jobs");
  socket.on("join:user", (userId) => {
    if (typeof userId !== "string" || userId.length < 8 || userId.length > 128) return;
    void socket.join(`user:${userId}`);
  });
});

server.listen(port, () => {
  console.log(`> Ready on http://${hostname}:${port} (Socket.io /socket.io/)`);
});
