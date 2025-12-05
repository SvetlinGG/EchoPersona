import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import settingsRoute from './routes/settings.js';
import personaRoute from './routes/persona.js';
import { handleWsConnection } from './ws-working.js';

const app = express();
app.use(cors());
app.use(express.json());

// REST endpoints
app.get('/health', (req, res) => res.json({ ok: true, service: 'EchoPersona' }));
app.use('/settings', settingsRoute);
app.use('/persona', personaRoute);

const PORT = process.env.PORT || 3000;
const WS_PATH = process.env.WS_PATH || '/ws';

// HTTP + WS server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: WS_PATH });

wss.on('connection', handleWsConnection);

server.listen(PORT, () => {
    console.log(`✅ EchoPersona backend running`);
  console.log(`REST: http://localhost:${PORT}`);
  console.log(`WS  : ws://localhost:${PORT}${WS_PATH}`);
})