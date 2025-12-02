// REAL AI conversation using OpenAI API
import fetch from 'node-fetch';

export function handleWsConnection(ws) {
  send(ws, { type: 'hello', payload: { server: 'EchoPersona Real AI' } });

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
        console.log('✅ Real transcript:', transcript);
      } catch (e) {
        console.error('❌ STT failed');
      }
      
      send(ws, { type: 'finalTranscription', text: transcript });
      
      // REAL OpenAI API call
      let response = 'I understand what you\'re saying.';
      
      try {
        console.log('🤖 Calling OpenAI API...');
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful, friendly AI assistant having a natural conversation. Respond naturally and helpfully to whatever the user says. Be conversational, not robotic.'
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
        
        console.log('OpenAI status:', openaiResponse.status);
        
        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          response = data.choices[0].message.content.trim();
          console.log('✅ OpenAI SUCCESS:', response);
        } else {
          const errorText = await openaiResponse.text();
          console.error('❌ OpenAI API error:', openaiResponse.status, errorText);
          
          // Try LiquidMetal AI as backup
          response = await tryLiquidMetal(transcript);
        }
      } catch (error) {
        console.error('❌ OpenAI request failed:', error.message);
        response = await tryLiquidMetal(transcript);
      }
      
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

async function tryLiquidMetal(transcript) {
  try {
    console.log('🔄 Trying LiquidMetal AI backup...');
    
    const response = await fetch('https://api.liquidmetal.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LIQUIDMETAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Respond naturally to the user.'
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
      console.log('✅ LiquidMetal SUCCESS');
      return data.choices[0].message.content.trim();
    }
  } catch (error) {
    console.error('❌ LiquidMetal also failed:', error.message);
  }
  
  // Final fallback
  return `I heard you say "${transcript}". That's interesting! I'm having some technical difficulties with my AI brain right now, but I'm listening. Can you try asking me something else?`;
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function sendBinary(ws, buf) {
  if (ws.readyState === ws.OPEN) ws.send(buf, { binary: true });
}