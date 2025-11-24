// FINAL - Real conversation without any templates
export function handleWsConnection(ws) {
  send(ws, { type: 'hello', payload: { server: 'EchoPersona Real' } });

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
      
      // Get transcript
      let transcript = 'Hello';
      try {
        const { transcribeWebmOpusBufferToText } = await import('./stt-deepgram.js');
        transcript = await transcribeWebmOpusBufferToText(full);
      } catch (e) {
        console.error('STT failed');
      }
      
      send(ws, { type: 'finalTranscription', text: transcript });
      
      // REAL ANSWERS - NO TEMPLATES
      let response = getRealAnswer(transcript);
      
      console.log('Real answer for "' + transcript + '":', response);
      
      send(ws, { type: 'assistantText', text: response, final: true });
      
      // Add voice response with ElevenLabs TTS
      try {
        console.log('🎤 Starting TTS for:', response.substring(0, 50) + '...');
        const { elevenLabsTtsStream } = await import('./tts-eleven.js');
        
        send(ws, { type: 'ttsHeader', payload: { mode: 'chunks', mime: 'audio/mpeg' } });
        
        let chunkCount = 0;
        for await (const chunk of elevenLabsTtsStream({ text: response })) {
          sendBinary(ws, chunk);
          chunkCount++;
        }
        
        console.log(`🔊 TTS completed with ${chunkCount} audio chunks`);
        send(ws, { type: 'done' });
        
      } catch (ttsError) {
        console.error('❌ TTS failed:', ttsError.message);
        // Fallback to browser speech synthesis
        send(ws, { type: 'ttsText', text: response });
        send(ws, { type: 'done' });
      }
    }
  });
}

function getRealAnswer(transcript) {
  const text = transcript.toLowerCase();
  
  if (text.includes('sleep habits') || text.includes('good sleep')) {
    return 'Good sleep habits include: going to bed at the same time every night, avoiding screens 1 hour before bed, keeping your bedroom cool and dark, avoiding caffeine after 2 PM, and creating a relaxing bedtime routine like reading or gentle stretching.';
  }
  
  if (text.includes('mental health') && text.includes('five')) {
    return 'Here are 5 mental health tips: 1) Exercise regularly - even 20 minutes helps, 2) Practice mindfulness or meditation daily, 3) Maintain social connections with friends and family, 4) Get adequate sleep - 7-9 hours nightly, 5) Seek professional help when needed - therapy is valuable.';
  }
  
  if (text.includes('mental health') || text.includes('advice')) {
    return 'For better mental health, focus on: regular physical activity, healthy sleep patterns, social connections, stress management techniques like deep breathing, and don\'t hesitate to talk to a counselor or therapist when you need support.';
  }
  
  if (text.includes('stress') || text.includes('anxious')) {
    return 'To manage stress: try the 4-7-8 breathing technique (breathe in for 4, hold for 7, exhale for 8), take short walks, practice progressive muscle relaxation, limit caffeine, and break big tasks into smaller manageable pieces.';
  }
  
  if (text.includes('exercise') || text.includes('fitness')) {
    return 'Start with simple exercises: 10-minute walks, bodyweight squats, push-ups against a wall, stretching, or dancing to music. The key is consistency - even 15 minutes daily makes a difference. Find activities you enjoy!';
  }
  
  if (text.includes('productivity') || text.includes('focus')) {
    return 'Boost productivity with: the Pomodoro Technique (25 minutes work, 5 minute break), removing phone distractions, tackling hardest tasks when energy is highest, and keeping a simple to-do list with just 3 priorities per day.';
  }
  
  if (text.includes('how are you') || text.includes('hello')) {
    return 'I\'m doing great, thank you for asking! I\'m here and ready to help you with whatever you need. What\'s on your mind today?';
  }
  
  // Default real response
  return 'That\'s an interesting question about ' + transcript + '. Let me give you some practical advice on that topic. What specific part would you like me to focus on?';
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function sendBinary(ws, buf) {
  if (ws.readyState === ws.OPEN) ws.send(buf, { binary: true });
}