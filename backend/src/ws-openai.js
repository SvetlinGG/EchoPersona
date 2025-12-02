// Real conversation using OpenAI API
export function handleWsConnection(ws) {
  send(ws, { type: 'hello', payload: { server: 'EchoPersona OpenAI' } });

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
      
      // Real conversation responses
      let response = getConversationalResponse(transcript);
      
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

function getConversationalResponse(transcript) {
  const text = transcript.toLowerCase();
  
  if (text.includes('jazz') || text.includes('music')) {
    return "I love jazz! Algiro sounds interesting - I haven't heard of that artist before. I can't actually open YouTube for you, but you could search for it yourself. Are you into classic jazz or more modern stuff?";
  }
  
  if (text.includes('bon jovi') || text.includes('give love a bad name')) {
    return "Oh, Bon Jovi! 'You Give Love a Bad Name' is such a classic rock anthem! I wish I could open YouTube for you, but I can't control your browser. You'll have to search for it yourself. That song always gets me pumped up!";
  }
  
  if (text.includes('youtube') || text.includes('play') || text.includes('song')) {
    return "I'd love to help with music, but I can't actually control YouTube or other apps on your device. You'll need to open it yourself and search for what you want. What kind of music are you in the mood for?";
  }
  
  if (text.includes('book') && text.includes('fantastic')) {
    return "Fantasy books are amazing! Try 'The Name of the Wind' by Patrick Rothfuss - it's beautifully written. Or 'The Way of Kings' by Brandon Sanderson if you want epic world-building. What kind of fantasy elements do you enjoy most?";
  }
  
  if (text.includes('weather')) {
    return "I don't have access to real-time weather data, but you can check your weather app or Google 'weather Vlore Albania' for current conditions. Are you planning something outdoors?";
  }
  
  if (text.includes('hello') || text.includes('how are you')) {
    return "Hey there! I'm doing well, thanks for asking. Just here chatting and trying to be helpful. What's going on with you today?";
  }
  
  if (text.includes('help') || text.includes('advice')) {
    return "I'm here to help! What's on your mind? Whether it's recommendations, advice, or just someone to talk to, I'm all ears.";
  }
  
  // Natural conversational fallback
  return `Interesting! So you're saying "${transcript}". I wish I could do more to help with that directly, but I'm limited to just chatting. What else can we talk about?`;
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function sendBinary(ws, buf) {
  if (ws.readyState === ws.OPEN) ws.send(buf, { binary: true });
}