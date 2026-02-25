import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type { ClientToServerEvents, ServerToClientEvents } from '@answer-arena/shared';
import { config } from './config.js';
import { RoomManager } from './modules/RoomManager.js';
import { registerSocketHandlers } from './handlers/socketHandlers.js';
import { registerApiRoutes } from './handlers/apiRoutes.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.clientUrl }));
  app.use(express.json());

  const httpServer = createServer(app);

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
    },
    pingInterval: 10_000,
    pingTimeout: 5_000,
  });

  const roomManager = new RoomManager();

  registerApiRoutes(app, roomManager);
  registerSocketHandlers(io, roomManager);

  const cleanupInterval = setInterval(() => {
    roomManager.cleanExpiredRooms();
  }, 60_000);

  return { app, httpServer, io, roomManager, cleanupInterval };
}
