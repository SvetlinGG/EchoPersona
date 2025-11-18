// src/ws.js
// import { transcribeWebmOpusBufferToText, createRealtimeTranscription } from './stt-deepgram.js';
// import { elevenLabsTtsStream } from './tts-eleven.js';
import EchoPersonaRaindrop from './raindrop-mcp.js';
import VultrServices from './vultr-integration.js';

const raindrop = new EchoPersonaRaindrop();
const vultr = new VultrServices();

export function handleWsConnection(ws) {
  send(ws, { type: 'hello', payload: { server: 'EchoPersona WS (real STT/TTS)' } });

  let collecting = false;
  let audioBuffers = []; // we collect the incoming binary chunks

  ws.on('message', async (data, isBinary) => {
    if (isBinary) {
      if (collecting) {
        audioBuffers.push(Buffer.from(data));
        console.log('Received audio chunk:', data.byteLength, 'bytes. Total chunks:', audioBuffers.length);
      }
      return;
    }


    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.type === 'beginUtterance') {
      console.log('Starting audio collection');
      collecting = true;
      audioBuffers = [];
      send(ws, { type: 'partialTranscription', text: '' });
    }

    if (msg.type === 'endUtterance') {
      console.log('Ending audio collection, buffer size:', audioBuffers.length);
      collecting = false;
      
      if (audioBuffers.length === 0) {
        send(ws, { type: 'finalTranscription', text: 'No audio received' });
        return;
      }
      
      const full = Buffer.concat(audioBuffers);
      console.log('Total audio buffer size:', full.length);
      
      if (full.length === 0) {
        send(ws, { type: 'finalTranscription', text: 'No audio received' });
        send(ws, { type: 'assistantText', text: 'I didn\'t hear anything. Please try speaking again.', final: true });
        return;
      }

      // Try multiple transcription methods
      let transcript = '';
      
      try {
        // Try Deepgram first
        const { transcribeWebmOpusBufferToText } = await import('./stt-deepgram.js');
        console.log('Trying Deepgram transcription, buffer size:', full.length);
        transcript = await transcribeWebmOpusBufferToText(full);
        console.log('Deepgram transcript:', transcript);
      } catch (deepgramError) {
        console.error('Deepgram failed:', deepgramError.message);
        
        try {
          // Fallback to LiquidMetal AI
          const { transcribeLiquidMetal } = await import('./liquidmetal-ai.js');
          console.log('Trying LiquidMetal transcription');
          transcript = await transcribeLiquidMetal(full);
          console.log('LiquidMetal transcript:', transcript);
        } catch (liquidError) {
          console.error('LiquidMetal failed:', liquidError.message);
          
          try {
            // Final fallback - simple mock transcription for demo
            const { simpleTranscribe } = await import('./stt-simple.js');
            console.log('Using simple fallback transcription');
            transcript = await simpleTranscribe(full);
            console.log('Simple transcript:', transcript);
          } catch (simpleError) {
            console.error('All transcription methods failed:', simpleError.message);
            transcript = 'I heard you speaking but could not transcribe it';
          }
        }
      }
      
      if (!transcript || transcript.trim() === '') {
        send(ws, { type: 'finalTranscription', text: '[No speech detected]' });
        send(ws, { type: 'assistantText', text: 'I couldn\'t understand what you said. Could you please try again?', final: true });
        return;
      }
      
      send(ws, { type: 'finalTranscription', text: transcript });
      
      const emotion = fakeEmotionFromText(transcript);
      send(ws, { type: 'emotion', payload: emotion });
      
      // Generate real AI response
      let response;
      try {
        const { generateLiquidMetalResponse } = await import('./liquidmetal-ai.js');
        response = await generateLiquidMetalResponse(transcript, emotion);
        console.log('LiquidMetal AI response:', response);
      } catch (aiError) {
        console.error('AI response failed:', aiError.message);
        response = craftAssistantReply(transcript, emotion);
      }
      
      send(ws, { type: 'assistantText', text: response, final: true });
      
      // Add TTS streaming
      try {
        const { elevenLabsTtsStream } = await import('./tts-eleven.js');
        send(ws, { type: 'ttsHeader', payload: { mode: 'chunks', mime: 'audio/mpeg' } });
        for await (const chunk of elevenLabsTtsStream({ text: response })) {
          sendBinary(ws, chunk);
        }
        send(ws, { type: 'done' });
      } catch (ttsError) {
        console.error('TTS error:', ttsError);
        send(ws, { type: 'done' });
      }
    }

    if (msg.type === 'settings') {
      send(ws, { type: 'assistantText', text: 'Settings received.', final: true });
    }
  });

  ws.on('close', () => {});
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}
function sendBinary(ws, buf) {
  if (ws.readyState === ws.OPEN) ws.send(buf, { binary: true });
}


function fakeEmotionFromText(text) {
  const t = (text || '').toLowerCase();
  
  // Stress indicators
  if (t.includes('overwhelm') || t.includes('stress') || t.includes('difficult') || t.includes('tired') || t.includes('anxious')) {
    return { valence: -0.3, arousal: 0.7, label: 'stressed' };
  }
  
  // Positive indicators
  if (t.includes('great') || t.includes('awesome') || t.includes('happy') || t.includes('excited') || t.includes('good')) {
    return { valence: 0.7, arousal: 0.6, label: 'happy' };
  }
  
  // Sadness indicators
  if (t.includes('sad') || t.includes('down') || t.includes('depressed') || t.includes('lonely')) {
    return { valence: -0.5, arousal: 0.2, label: 'sad' };
  }
  
  // Energy indicators
  if (t.includes('energetic') || t.includes('motivated') || t.includes('ready')) {
    return { valence: 0.4, arousal: 0.8, label: 'energetic' };
  }
  
  return { valence: 0.0, arousal: 0.4, label: 'neutral' };
}

function craftAssistantReply(userText, emo) {
  const responses = {
    stressed: [
      "I can hear the stress in your voice. Let's break this down into tiny steps. What's one 2-minute task you could do right now?",
      "Take a deep breath with me. Now, what's the smallest possible step forward you could take?",
      "I understand you're feeling overwhelmed. Let's focus on just ONE thing. What matters most right now?"
    ],
    happy: [
      "I love your positive energy! Let's channel that into something productive. What exciting project are you working on?",
      "Your enthusiasm is contagious! What would you like to accomplish while you're feeling this motivated?",
      "Great mood! Perfect time to tackle something challenging. What's been on your to-do list?"
    ],
    sad: [
      "I hear that you're going through a tough time. Sometimes the smallest step forward is the biggest victory. What's one gentle thing you could do for yourself?",
      "It's okay to feel this way. Let's start with something simple and comforting. What would make you feel just 1% better?",
      "I'm here with you. What's one tiny thing that might bring a small spark of accomplishment?"
    ],
    energetic: [
      "I can feel your energy! This is perfect timing for tackling bigger goals. What's something ambitious you've been putting off?",
      "Your motivation is powerful right now! What's the most important thing you could accomplish today?",
      "Amazing energy! Let's use this momentum. What's your biggest priority?"
    ],
    neutral: [
      "Let's find your focus. What's one thing that would make today feel successful?",
      "What's on your mind? I'm here to help you break it down into manageable pieces.",
      "Ready to make progress? What would you like to work on together?"
    ]
  };
  
  const emotionResponses = responses[emo.label] || responses.neutral;
  return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
}

