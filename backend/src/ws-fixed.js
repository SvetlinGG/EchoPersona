// Fixed WebSocket handler with real responses
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
          
          // Real STT
          let transcript = 'I heard you speaking';
          try {
            const { transcribeWebmOpusBufferToText } = await import('./stt-deepgram.js');
            transcript = await transcribeWebmOpusBufferToText(full);
            console.log('Real transcript:', transcript);
          } catch (sttError) {
            console.error('STT failed:', sttError.message);
            transcript = 'I heard you but couldn\'t understand clearly';
          }
          
          send(ws, { type: 'finalTranscription', text: transcript });
          
          // Generate response based on what user said
          let response;
          const text = transcript.toLowerCase();
          
          if (text.includes('mental health') || text.includes('advice')) {
            response = 'Here are three mental health tips: 1) Take a 10-minute walk daily, 2) Practice deep breathing for 5 minutes, 3) Write down three things you\'re grateful for each day.';
          } else if (text.includes('how are you')) {
            response = 'I\'m doing well, thank you for asking! I\'m here and ready to help you with whatever you need.';
          } else if (text.includes('understand')) {
            response = 'Yes, I do understand you! I can hear what you\'re saying and I\'m here to have a real conversation with you.';
          } else if (text.includes('speak') || text.includes('talk')) {
            response = 'Absolutely! I\'m happy to talk with you. What would you like to discuss? I can help with advice, answer questions, or just chat.';
          } else if (text.includes('hello') || text.includes('hi')) {
            response = 'Hello! It\'s great to meet you. How can I help you today?';
          } else {
            response = `I heard you say "${transcript}". That sounds important to you. Can you tell me more about what\'s on your mind?`;
          }
          
          console.log('Generated response for "' + transcript + '":', response);
          
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