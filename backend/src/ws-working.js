// Working AI conversation using Hugging Face API (free)
export function handleWsConnection(ws) {
  send(ws, { type: 'hello', payload: { server: 'EchoPersona Working AI' } });

  let collecting = false;
  let audioBuffers = [];

  ws.on('message', async (data, isBinary) => {
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
      const full = Buffer.concat(audioBuffers);
      
      // Real STT
      let transcript = 'Hello';
      try {
        const { transcribeWebmOpusBufferToText } = await import('./stt-deepgram.js');
        transcript = await transcribeWebmOpusBufferToText(full);
        console.log('✅ Transcript:', transcript);
      } catch (e) {
        console.error('❌ STT failed');
      }
      
      send(ws, { type: 'finalTranscription', text: transcript });
      
      // Generate intelligent response
      const response = await generateIntelligentResponse(transcript);
      console.log('💬 Response:', response);
      
      send(ws, { type: 'assistantText', text: response, final: true });
      
      // TTS
      try {
        const { elevenLabsTtsStream } = await import('./tts-eleven.js');
        send(ws, { type: 'ttsHeader', payload: { mode: 'chunks', mime: 'audio/mpeg' } });
        
        for await (const chunk of elevenLabsTtsStream({ text: response })) {
          sendBinary(ws, chunk);
        }
        
        send(ws, { type: 'done' });
      } catch (e) {
        send(ws, { type: 'ttsText', text: response });
        send(ws, { type: 'done' });
      }
    }
  });
}

async function generateIntelligentResponse(transcript) {
  // Use LiquidMetal AI for natural conversation
  try {
    const response = await fetch('https://api.liquidmetal.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LIQUIDMETAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are EchoPersona, a warm and empathetic AI companion. Respond naturally and conversationally, like a helpful friend. Keep responses brief (1-2 sentences max) and engaging. No templates or robotic language.'
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        max_tokens: 100,
        temperature: 0.8
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content.trim();
    }
  } catch (error) {
    console.log('LiquidMetal failed, using fallback');
  }
  
  // Simple conversational fallback
  const responses = [
    `That's interesting! Tell me more about that.`,
    `I'd love to hear your thoughts on that.`,
    `What made you think about that?`,
    `That sounds important to you.`,
    `I'm curious to know more about your perspective.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function sendBinary(ws, buf) {
  if (ws.readyState === ws.OPEN) ws.send(buf, { binary: true });
}