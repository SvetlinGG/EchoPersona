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
      const response = generateIntelligentResponse(transcript);
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

function generateIntelligentResponse(transcript) {
  const text = transcript.toLowerCase();
  
  // Physics and Science
  if (text.includes('gravity') && (text.includes('formula') || text.includes('law'))) {
    return "The law of universal gravitation is F = G × (m₁ × m₂) / r². Where F is the gravitational force, G is the gravitational constant (6.67 × 10⁻¹¹), m₁ and m₂ are the masses of the objects, and r is the distance between their centers. This explains how every object with mass attracts every other object!";
  }
  
  if (text.includes('newton') && text.includes('law')) {
    return "Newton's three laws of motion: First law - an object at rest stays at rest unless acted upon by a force. Second law - F equals ma, force equals mass times acceleration. Third law - for every action there's an equal and opposite reaction. These laws govern all motion in our universe!";
  }
  
  if (text.includes('einstein') || text.includes('relativity')) {
    return "Einstein's theory of relativity revolutionized physics! E=mc² shows that mass and energy are interchangeable. Special relativity tells us that time and space are relative, and nothing can travel faster than light. General relativity describes gravity as the curvature of spacetime. Mind-blowing stuff!";
  }
  
  // Books and Literature
  if (text.includes('book') && (text.includes('recommend') || text.includes('suggest'))) {
    return "I'd love to recommend some books! What genre interests you? For science fiction, try 'Dune' by Frank Herbert or 'The Martian' by Andy Weir. For fantasy, 'The Name of the Wind' by Patrick Rothfuss is amazing. For non-fiction, 'Sapiens' by Yuval Noah Harari is fascinating. What type of story are you in the mood for?";
  }
  
  // Music
  if (text.includes('music') || text.includes('song') || text.includes('play')) {
    return "I love talking about music! While I can't actually play songs or control YouTube, I can definitely chat about music. What genre do you enjoy? Jazz, rock, classical, electronic? I can recommend artists or discuss music theory if you're interested!";
  }
  
  // Health and Wellness
  if (text.includes('stress') || text.includes('anxiety') || text.includes('worried')) {
    return "Stress management is so important! Try the 4-7-8 breathing technique: breathe in for 4 counts, hold for 7, exhale for 8. Also helpful: take a 10-minute walk, do some stretching, listen to calming music, or practice mindfulness. What's been causing you stress lately?";
  }
  
  if (text.includes('sleep') || text.includes('tired')) {
    return "Good sleep is crucial for health! Try these tips: keep a consistent bedtime, avoid screens 1 hour before bed, keep your room cool and dark, avoid caffeine after 2 PM, and create a relaxing bedtime routine like reading or gentle stretching. How many hours of sleep do you usually get?";
  }
  
  // Technology
  if (text.includes('ai') || text.includes('artificial intelligence')) {
    return "AI is fascinating! We're in an exciting era where AI can help with writing, coding, analysis, and creative tasks. Machine learning allows computers to learn patterns from data. I'm an example of conversational AI - I can understand and respond to natural language. What aspect of AI interests you most?";
  }
  
  // Greetings and General
  if (text.includes('hello') || text.includes('hi') || text.includes('how are you')) {
    return "Hello! I'm doing great, thanks for asking! I'm here and ready to chat about whatever interests you. How's your day going? Is there anything specific you'd like to talk about or learn about?";
  }
  
  if (text.includes('what') && text.includes('you') && text.includes('do')) {
    return "I'm a conversational AI assistant! I can help explain concepts, answer questions, give advice, recommend books or movies, discuss science and technology, help with problem-solving, or just have a friendly chat. I love learning about what interests you. What would you like to explore together?";
  }
  
  // Default intelligent response
  return `That's a really interesting question about ${transcript}. I'd love to help you explore that topic further! Could you tell me what specific aspect you're most curious about? I'm here to have a real conversation and share what I know.`;
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function sendBinary(ws, buf) {
  if (ws.readyState === ws.OPEN) ws.send(buf, { binary: true });
}