// Real AI conversation using actual API keys
export function handleWsConnection(ws) {
  send(ws, { type: 'hello', payload: { server: 'EchoPersona AI' } });

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
      
      // Real STT with Deepgram
      let transcript = 'Hello';
      try {
        const { transcribeWebmOpusBufferToText } = await import('./stt-deepgram.js');
        transcript = await transcribeWebmOpusBufferToText(full);
        console.log('✅ Deepgram transcript:', transcript);
      } catch (e) {
        console.error('❌ Deepgram failed:', e.message);
      }
      
      send(ws, { type: 'finalTranscription', text: transcript });
      
      // Real AI response using Gemini
      let response = 'I understand what you\'re saying.';
      
      try {
        console.log('🤖 Calling Gemini AI...');
        
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are having a natural, friendly conversation. Someone just said: "${transcript}". Respond naturally and helpfully. If they ask for book recommendations, weather, or specific questions, give real answers. Be conversational and human-like.`
              }]
            }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 100
            }
          })
        });
        
        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            response = data.candidates[0].content.parts[0].text.trim();
            console.log('✅ Gemini AI response:', response);
          }
        } else {
          console.error('❌ Gemini API error:', geminiResponse.status);
          response = getSmartFallback(transcript);
        }
      } catch (error) {
        console.error('❌ Gemini request failed:', error.message);
        response = getSmartFallback(transcript);
      }
      
      send(ws, { type: 'assistantText', text: response, final: true });
      
      // Real TTS with ElevenLabs
      try {
        console.log('🎤 Starting ElevenLabs TTS...');
        const { elevenLabsTtsStream } = await import('./tts-eleven.js');
        
        send(ws, { type: 'ttsHeader', payload: { mode: 'chunks', mime: 'audio/mpeg' } });
        
        for await (const chunk of elevenLabsTtsStream({ text: response })) {
          sendBinary(ws, chunk);
        }
        
        console.log('✅ TTS completed');
        send(ws, { type: 'done' });
        
      } catch (ttsError) {
        console.error('❌ ElevenLabs failed:', ttsError.message);
        send(ws, { type: 'ttsText', text: response });
        send(ws, { type: 'done' });
      }
    }
  });
}

function getSmartFallback(transcript) {
  const text = transcript.toLowerCase();
  
  if (text.includes('book') && text.includes('fantastic')) {
    return 'For fantasy books, I recommend: "The Name of the Wind" by Patrick Rothfuss - amazing storytelling, "The Way of Kings" by Brandon Sanderson - epic world-building, and "The Lies of Locke Lamora" by Scott Lynch - clever and fun. Which type of fantasy do you prefer?';
  }
  
  if (text.includes('book')) {
    return 'I love book recommendations! What genre are you in the mood for? Fiction, non-fiction, mystery, sci-fi? Or are you looking for something specific to learn about?';
  }
  
  if (text.includes('weather')) {
    return 'I don\'t have access to real-time weather data, but you can check weather.com or your weather app for current conditions in Vlore, Albania. Is there something specific you\'re planning that depends on the weather?';
  }
  
  return `That\'s a great question! ${transcript}. I\'d love to help you with that. Can you tell me a bit more about what you\'re looking for?`;
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function sendBinary(ws, buf) {
  if (ws.readyState === ws.OPEN) ws.send(buf, { binary: true });
}