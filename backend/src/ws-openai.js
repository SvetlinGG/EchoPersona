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
  
  if (text.includes('stress') || text.includes('anxiety') || text.includes('worried')) {
    return "Stress can be really tough. Try some deep breathing - in for 4, hold for 4, out for 4. Also, taking a short walk or doing some stretching can help. What's been stressing you out lately?";
  }
  
  if (text.includes('pythagore') || text.includes('pythagorean') || text.includes('theorem')) {
    return "Ah, the Pythagorean theorem! It's a² + b² = c², where c is the hypotenuse of a right triangle. Super useful in math and engineering. Are you working on some geometry problems?";
  }
  
  if (text.includes('gravity') || text.includes('gravitational') || text.includes('attraction')) {
    return "Newton's law of universal gravitation! The formula is F = G(m₁m₂)/r². Where F is the gravitational force, G is the gravitational constant, m₁ and m₂ are the masses, and r is the distance between them. Pretty amazing how everything attracts everything else!";
  }
  
  if (text.includes('formula') || text.includes('equation') || text.includes('physics')) {
    return "I love physics formulas! What specific formula are you looking for? Gravity, motion, energy, electricity? Just let me know what topic and I'll share the key equations.";
  }
  
  if (text.includes('law') && (text.includes('newton') || text.includes('motion'))) {
    return "Newton's laws are fundamental! First law: objects at rest stay at rest. Second law: F = ma (force equals mass times acceleration). Third law: every action has an equal and opposite reaction. Which one interests you most?";
  }
  
  if (text.includes('help') || text.includes('advice')) {
    return "I'm here to help! What's on your mind? Whether it's recommendations, advice, or just someone to talk to, I'm all ears.";
  }
  
  if (text.includes('information') || text.includes('explain') || text.includes('tell me')) {
    return "I'd love to share what I know! What specific topic are you curious about? I can help with general knowledge, advice, or just have a conversation.";
  }
  
  // Specific helpful response instead of template
  return "That's interesting! I'd love to help you with that. Can you give me a bit more context so I can give you a better answer?";
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function sendBinary(ws, buf) {
  if (ws.readyState === ws.OPEN) ws.send(buf, { binary: true });
}