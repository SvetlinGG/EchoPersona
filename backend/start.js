import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, service: 'EchoPersona' }));

const PORT = 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('WebSocket connected');
  ws.send(JSON.stringify({ type: 'hello', payload: { server: 'EchoPersona WS' } }));
  
  ws.on('message', (data) => {
    console.log('Received:', data.toString());
  });
});

server.listen(PORT, () => {
  console.log(`✅ EchoPersona backend running`);
  console.log(`REST: http://localhost:${PORT}`);
  console.log(`WS  : ws://localhost:${PORT}/ws`);
});