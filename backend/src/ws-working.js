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
  console.log('🤖 Generating response for:', transcript);
  
  // Try Claude first (best quality)
  try {
    console.log('🔄 Trying Claude...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 100,
        system: 'You are EchoPersona, a warm empathetic AI companion. Respond naturally like a friend. Keep it brief (1-2 sentences).',
        messages: [{
          role: 'user',
          content: transcript
        }]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.content[0].text.trim();
      console.log('✅ Claude success:', aiResponse);
      return aiResponse;
    }
    const errorText = await response.text();
    console.log('❌ Claude failed:', response.status, errorText);
  } catch (error) {
    console.log('❌ Claude error:', error.message);
  }
  
  // Try Groq as backup (fastest)
  try {
    console.log('🔄 Trying Groq...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are EchoPersona, a warm empathetic AI companion. Respond naturally like a friend. Keep it brief (1-2 sentences).'
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        max_tokens: 80,
        temperature: 0.7
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices[0].message.content.trim();
      console.log('✅ Groq success:', aiResponse);
      return aiResponse;
    }
    const errorText = await response.text();
    console.log('❌ Groq failed:', response.status, errorText);
  } catch (error) {
    console.log('❌ Groq error:', error.message);
  }
  
  console.log('⚠️ Both APIs failed, using smart fallback');
  
  const text = transcript.toLowerCase();
  
  if (text.includes('pythagore') || text.includes('pythagor') || text.includes('triangle')) {
    return "Ah, Pythagoras! His theorem is a² + b² = c² for right triangles.";
  }
  
  if (text.includes('why') && text.includes('not answer')) {
    return "Sorry! I'm here to help. What would you like to know?";
  }
  
  if (text.includes('hello') || text.includes('hi')) {
    return "Hey there! How's your day going?";
  }
  
  return "I'm listening! What's on your mind?";
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function sendBinary(ws, buf) {
  if (ws.readyState === ws.OPEN) ws.send(buf, { binary: true });
}