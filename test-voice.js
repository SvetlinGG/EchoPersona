// Quick test script for voice system
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', () => {
  console.log('✅ WebSocket connected');
  
  // Simulate voice input
  ws.send(JSON.stringify({ type: 'beginUtterance' }));
  
  // Send fake audio data
  const fakeAudio = Buffer.alloc(5000, 0x42);
  ws.send(fakeAudio, { binary: true });
  
  setTimeout(() => {
    ws.send(JSON.stringify({ type: 'endUtterance' }));
  }, 1000);
});

ws.on('message', (data, isBinary) => {
  if (!isBinary) {
    const msg = JSON.parse(data.toString());
    console.log('📨 Received:', msg.type, msg.text || msg.payload);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 5000);