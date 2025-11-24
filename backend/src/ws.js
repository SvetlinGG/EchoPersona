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
      
      // Real AI Conversation using Gemini
      let response;
      try {
        const conversationPrompt = `You are a helpful AI assistant. Answer this question directly and helpfully: "${transcript}"
        
Don't ask questions back. Give actual advice, examples, or answers. Be conversational but helpful.`;
        
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: conversationPrompt }] }],
            generationConfig: { 
              temperature: 0.7, 
              maxOutputTokens: 100,
              topP: 0.8,
              topK: 40
            }
          })
        });
        
        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          response = data.candidates[0].content.parts[0].text.trim();
          console.log('Gemini conversation success:', response);
        } else {
          const errorText = await geminiResponse.text();
          console.error('Gemini API error:', geminiResponse.status, errorText);
          throw new Error(`Gemini API failed: ${geminiResponse.status}`);
        }
      } catch (error) {
        console.error('Gemini conversation failed:', error);
        // Generate a real answer based on the question
        response = generateRealAnswer(transcript);
        console.log('Using fallback real answer:', response);
      }
      
      send(ws, { type: 'assistantText', text: response, final: true });
      
      // Add TTS streaming with fallback
      try {
        const { elevenLabsTtsStream } = await import('./tts-eleven.js');
        console.log('Starting ElevenLabs TTS for:', response.substring(0, 50) + '...');
        send(ws, { type: 'ttsHeader', payload: { mode: 'chunks', mime: 'audio/mpeg' } });
        
        let chunkCount = 0;
        for await (const chunk of elevenLabsTtsStream({ text: response })) {
          sendBinary(ws, chunk);
          chunkCount++;
        }
        console.log(`TTS completed successfully with ${chunkCount} chunks`);
        send(ws, { type: 'done' });
      } catch (ttsError) {
        console.error('ElevenLabs TTS failed:', ttsError.message);
        
        // Fallback: Use browser's built-in speech synthesis
        try {
          send(ws, { type: 'ttsText', text: response });
          send(ws, { type: 'done' });
          console.log('Using browser TTS fallback');
        } catch (fallbackError) {
          console.error('All TTS methods failed:', fallbackError.message);
          send(ws, { type: 'done' });
        }
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

function generateDynamicResponse(userText, emotion) {
  const text = userText.toLowerCase();
  
  // Analyze what user is talking about
  if (text.includes('work') || text.includes('job') || text.includes('project')) {
    if (emotion.label === 'stressed') {
      return `I understand work is feeling overwhelming right now. Let's break down your work tasks. What's the most urgent thing you need to handle today? We can tackle it step by step.`;
    }
    return `I hear you talking about work. What specific project or task would you like to focus on? I can help you organize your approach.`;
  }
  
  if (text.includes('tired') || text.includes('exhausted') || text.includes('sleep')) {
    return `It sounds like you're feeling drained. Your energy is important. Have you been getting enough rest? Maybe we should focus on something that gives you energy rather than drains it.`;
  }
  
  if (text.includes('help') || text.includes('stuck') || text.includes('don\'t know')) {
    return `I'm here to help you figure this out. From what you've told me, it sounds like you need some clarity. What's the main challenge you're facing right now?`;
  }
  
  if (text.includes('time') || text.includes('deadline') || text.includes('schedule')) {
    return `Time management can be tricky. Let's look at your priorities. What's the most important thing that needs your attention in the next hour?`;
  }
  
  // Default personalized response based on emotion
  const emotionResponses = {
    stressed: `I can sense you're feeling stressed about "${userText}". Let's take this one small step at a time. What's the tiniest action you could take right now?`,
    happy: `I love hearing the positivity in your voice when you talk about "${userText}"! How can we build on this good energy?`,
    sad: `I hear the heaviness in your words about "${userText}". It's okay to feel this way. What's one small thing that might help right now?`,
    energetic: `Your energy around "${userText}" is fantastic! Let's channel this motivation. What's your biggest goal here?`,
    neutral: `You mentioned "${userText}". Tell me more about what's on your mind with this. How can I help you move forward?`
  };
  
  return emotionResponses[emotion.label] || `I heard you say "${userText}". What would you like to explore or work on with this?`;
}

