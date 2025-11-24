// Simple WebSocket handler with direct Gemini API
export function handleWsConnection(ws) {
  send(ws, { type: 'hello', payload: { server: 'EchoPersona WS' } });

  let collecting = false;
  let audioBuffers = [];

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
  
  ws.on('message', async (data, isBinary) => {
    try {
    if (isBinary) {
      if (collecting) audioBuffers.push(Buffer.from(data));
      return;
    }

    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.type === 'beginUtterance') {
      collecting = true;
      audioBuffers = [];
    }

    if (msg.type === 'endUtterance') {
      collecting = false;
      
      try {
        const full = Buffer.concat(audioBuffers);
        console.log('Processing audio buffer size:', full.length);
        
        // Mock transcript for testing
        const transcript = 'Hello, I need some advice today';
        send(ws, { type: 'finalTranscription', text: transcript });
        
        // Simple response without external APIs
        const response = 'I\'m here to help! What specific area would you like advice on? I can help with productivity, wellness, or general life tips.';
        
        send(ws, { type: 'assistantText', text: response, final: true });
        send(ws, { type: 'done' });
        
        console.log('✅ Response sent successfully');
        
      } catch (error) {
        console.error('❌ Error processing utterance:', error);
        send(ws, { type: 'finalTranscription', text: 'I heard you speaking' });
        send(ws, { type: 'assistantText', text: 'I\'m listening! Can you try speaking again?', final: true });
        send(ws, { type: 'done' });
      }
    }
    } catch (messageError) {
      console.error('Message handling error:', messageError);
      send(ws, { type: 'assistantText', text: 'Something went wrong. Please try again.', final: true });
    }
  });
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function sendBinary(ws, buf) {
  if (ws.readyState === ws.OPEN) ws.send(buf, { binary: true });
}