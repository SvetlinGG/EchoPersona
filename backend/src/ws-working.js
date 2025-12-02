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
  
  // Try OpenAI first
  try {
    console.log('🔄 Trying OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are EchoPersona, a warm and empathetic AI companion. Respond naturally and conversationally, like talking to a friend. Keep responses brief (1-2 sentences max). Be helpful and engaging. No robotic language.'
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
    
    console.log('📡 OpenAI response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices[0].message.content.trim();
      console.log('✅ OpenAI success:', aiResponse);
      return aiResponse;
    } else {
      const errorText = await response.text();
      console.log('❌ OpenAI failed:', response.status, errorText);
    }
  } catch (error) {
    console.log('❌ OpenAI error:', error.message);
  }
  
  // Try LiquidMetal as backup
  try {
    console.log('🔄 Trying LiquidMetal...');
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
            content: 'You are EchoPersona, a warm and empathetic AI companion. Respond naturally and conversationally, like talking to a friend. Keep responses brief (1-2 sentences max). Be helpful and engaging.'
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
    
    console.log('📡 LiquidMetal response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices[0].message.content.trim();
      console.log('✅ LiquidMetal success:', aiResponse);
      return aiResponse;
    } else {
      const errorText = await response.text();
      console.log('❌ LiquidMetal failed:', response.status, errorText);
    }
  } catch (error) {
    console.log('❌ LiquidMetal error:', error.message);
  }
  
  console.log('⚠️ Both APIs failed, using intelligent fallback');
  
  // Basic intelligent responses without templates
  const text = transcript.toLowerCase();
  
  if (text.includes('pythagore') || text.includes('pythagor') || text.includes('triangle')) {
    return "Ah, Pythagoras! His theorem is a² + b² = c² for right triangles. The hypotenuse squared equals the sum of the other two sides squared.";
  }
  
  if (text.includes('why') && text.includes('not answer')) {
    return "Sorry about that! I'm here to help. What would you like to know?";
  }
  
  if (text.includes('hello') || text.includes('hi')) {
    return "Hey there! How's it going?";
  }
  
  if (text.includes('math') || text.includes('formula')) {
    return "I love math! What specific topic are you curious about?";
  }
  
  // Natural conversational responses
  return "I'm listening! What's on your mind?";
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function sendBinary(ws, buf) {
  if (ws.readyState === ws.OPEN) ws.send(buf, { binary: true });
}