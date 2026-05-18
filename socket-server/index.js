/**
 * CreadiTn Socket.IO Real-time Server
 * Port: 3001
 *
 * Clients (mobile app / dashboard) connect via Socket.IO.
 * Backend (Spring Boot) posts events via HTTP POST /emit.
 *
 * Global events:
 *   - new-article     { article }
 *   - update-article  { article }
 *   - delete-article  { id }
 *
 * User-scoped events (room: "user:<userId>"):
 *   - kyc-update      { userId, status }
 *   - credit-update   { userId, creditLimit, walletBalance }
 *   - payment-due     { userId, amount, dueDate }
 *   - notification    { userId, message, type }
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const PORT = process.env.SOCKET_PORT ?? 3001;
// Secret shared with Spring Boot backend to authorise emit requests
const EMIT_SECRET = process.env.SOCKET_EMIT_SECRET ?? 'creaditn-socket-secret-2026';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ── Socket.IO connection ────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);

  // Client joins its personal room to receive user-scoped events
  socket.on('join-user', (userId) => {
    if (!userId) return;
    const room = `user:${userId}`;
    socket.join(room);
    console.log(`[socket] ${socket.id} joined room ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

// ── HTTP endpoint for Spring Boot to emit events ───────────────────────────

/**
 * POST /emit
 * Body: { secret, event, data }
 */
app.post('/emit', (req, res) => {
  const { secret, event, data } = req.body ?? {};

  if (!secret || secret !== EMIT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const allowedEvents = [
    // global article events
    'new-article', 'update-article', 'delete-article',
    // user-scoped events (require userId in data)
    'kyc-update', 'credit-update', 'payment-due', 'notification',
  ];
  if (!event || !allowedEvents.includes(event)) {
    return res.status(400).json({ error: 'Unknown event' });
  }

  const userScopedEvents = ['kyc-update', 'credit-update', 'payment-due', 'notification'];
  if (userScopedEvents.includes(event)) {
    const userId = data?.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId required for user-scoped events' });
    }
    const room = `user:${userId}`;
    io.to(room).emit(event, data ?? {});
    console.log(`[emit:user] room=${room} event=${event}`, JSON.stringify(data ?? {}).slice(0, 120));
  } else {
    io.emit(event, data ?? {});
    console.log(`[emit:global] ${event}`, JSON.stringify(data ?? {}).slice(0, 120));
  }

  res.json({ ok: true, event, connectedClients: io.engine.clientsCount });
});

// ── Health check ─────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', clients: io.engine.clientsCount, uptime: process.uptime() });
});

// ─────────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[socket-server] listening on port ${PORT}`);
});
