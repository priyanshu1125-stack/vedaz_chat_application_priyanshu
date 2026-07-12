require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectDB } = require('./config/db');
const messageRoutes = require('./routes/messages');
const errorHandler = require('./middleware/errorHandler');
const { setupSocket } = require('./socket');

const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (origin === CLIENT_URL) return true;
  return /^http:\/\/localhost:\d+$/.test(origin);
}

function corsOriginCallback(origin, callback) {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
}

const corsOptions = {
  origin: corsOriginCallback,
};

async function start() {
  await connectDB();

  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: corsOriginCallback,
      methods: ['GET', 'POST'],
    },
  });

  app.use(cors(corsOptions));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.set('io', io);

  app.use('/api/messages', messageRoutes);
  app.use(errorHandler);

  setupSocket(io);

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
