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
        
        // Real Gemini response
        let response = 'I understand what you\'re saying.';
        try {
          const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Someone said: "${transcript}". Respond naturally and helpfully in 1-2 sentences.`
                }]
              }],
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 50
              }
            })
          });
          
          if (geminiResponse.ok) {
            const data = await geminiResponse.json();
            response = data.candidates[0].content.parts[0].text.trim();
            console.log('Gemini real response:', response);
          }
        } catch (geminiError) {
          console.error('Gemini failed:', geminiError.message);
          response = `I heard you say "${transcript}". That\'s interesting! Tell me more about that.`;
        }
        
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