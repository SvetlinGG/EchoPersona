import { generateLiquidMetalResponse } from './liquidmetal-ai.js';
import { simpleTranscribe } from './stt-simple.js';
import { generateRealAnswer } from './real-answers.js';
import { generateOpenAIResponse } from './openai-chat.js';
import { transcribeWebmOpusBufferToText } from './stt-deepgram.js';
import { elevenLabsTtsStream } from './tts-eleven.js';

export function handleWsConnection(ws) {
  send(ws, { type: 'hello', payload: { server: 'EchoPersona WS' } });

  let collecting = false;
  let audioBuffers = [];

  ws.on('message', async (data, isBinary) => {
    if (isBinary) {
      if (collecting) {
        audioBuffers.push(Buffer.from(data));
        console.log('Received audio chunk:', data.byteLength, 'bytes');
      }
      return;
    }

    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.type === 'beginUtterance') {
      console.log('Starting audio collection');
      collecting = true;
      audioBuffers = [];
    }

    if (msg.type === 'endUtterance') {
      console.log('Ending audio collection');
      collecting = false;
      
      if (audioBuffers.length === 0) {
        send(ws, { type: 'finalTranscription', text: 'No audio received' });
        return;
      }
      
      const full = Buffer.concat(audioBuffers);
      
      // Get transcription - try Deepgram first, then fallback
      let transcript = '';
      try {
        if (process.env.DEEPGRAM_API_KEY) {
          transcript = await transcribeWebmOpusBufferToText(full);
          console.log('Deepgram transcript:', transcript);
        } else {
          throw new Error('DEEPGRAM_API_KEY not set');
        }
      } catch (error) {
        console.error('Deepgram transcription failed:', error.message);
        try {
          transcript = await simpleTranscribe(full);
          console.log('Fallback transcript:', transcript);
        } catch (fallbackError) {
          console.error('All transcription methods failed:', fallbackError);
          transcript = 'I heard you speaking';
        }
      }
      
      if (!transcript || transcript.trim() === '') {
        send(ws, { type: 'finalTranscription', text: '[No speech detected]' });
        send(ws, { type: 'assistantText', text: 'I couldn\'t understand what you said. Could you please try again?', final: true });
        send(ws, { type: 'done' });
        return;
      }
      
      send(ws, { type: 'finalTranscription', text: transcript });
      
      // Detect emotion from text
      const emotion = detectEmotionFromText(transcript);
      send(ws, { type: 'emotion', payload: emotion });
      
      // Generate AI response using real AI APIs for natural conversation
      let response;
      try {
        // Try OpenAI first for natural conversations
        if (process.env.OPENAI_API_KEY) {
          response = await generateOpenAIResponse(transcript, emotion);
          console.log('OpenAI response:', response);
        } 
        // Fallback to Gemini if OpenAI not available
        else if (process.env.GEMINI_API_KEY) {
          const conversationPrompt = `You are having a natural, friendly conversation. The person just said: "${transcript}". 
          
Respond naturally and conversationally in 1-2 sentences (under 40 words). Be empathetic, helpful, and human-like. Don't sound like a template or robot. Just have a normal conversation.`;
          
          const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: conversationPrompt }] }],
              generationConfig: { 
                temperature: 0.8, 
                maxOutputTokens: 100,
                topP: 0.9,
                topK: 40
              }
            })
          });
          
          if (geminiResponse.ok) {
            const data = await geminiResponse.json();
            response = data.candidates[0].content.parts[0].text.trim();
            console.log('Gemini response:', response);
          } else {
            throw new Error(`Gemini API failed: ${geminiResponse.status}`);
          }
        }
        // Final fallback to template-based responses
        else {
          response = await generateLiquidMetalResponse(transcript, emotion);
          console.log('Template response:', response);
        }
      } catch (error) {
        console.error('AI response generation failed:', error);
        response = generateRealAnswer(transcript);
      }
      
      send(ws, { type: 'assistantText', text: response, final: true });
      
      // TTS with ElevenLabs
      try {
        if (process.env.ELEVENLABS_API_KEY) {
          send(ws, { type: 'ttsHeader', payload: { mode: 'chunks', mime: 'audio/mpeg' } });
          
          let chunkCount = 0;
          for await (const chunk of elevenLabsTtsStream({ text: response })) {
            sendBinary(ws, chunk);
            chunkCount++;
          }
          console.log(`TTS completed with ${chunkCount} chunks`);
          send(ws, { type: 'done' });
        } else {
          // Fallback to browser TTS
          send(ws, { type: 'ttsText', text: response });
          send(ws, { type: 'done' });
        }
      } catch (error) {
        console.error('TTS failed:', error);
        send(ws, { type: 'ttsText', text: response });
        send(ws, { type: 'done' });
      }
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

function detectEmotionFromText(text) {
  const t = (text || '').toLowerCase();
  
  // Stress indicators
  if (t.includes('overwhelm') || t.includes('stress') || t.includes('difficult') || t.includes('tired') || t.includes('anxious') || t.includes('pressure')) {
    return { valence: -0.3, arousal: 0.7, label: 'stressed' };
  }
  
  // Positive indicators
  if (t.includes('great') || t.includes('awesome') || t.includes('happy') || t.includes('excited') || t.includes('good') || t.includes('wonderful')) {
    return { valence: 0.7, arousal: 0.6, label: 'happy' };
  }
  
  // Sadness indicators
  if (t.includes('sad') || t.includes('down') || t.includes('depressed') || t.includes('lonely') || t.includes('upset')) {
    return { valence: -0.5, arousal: 0.2, label: 'sad' };
  }
  
  // Energy indicators
  if (t.includes('energetic') || t.includes('motivated') || t.includes('ready') || t.includes('excited')) {
    return { valence: 0.4, arousal: 0.8, label: 'energetic' };
  }
  
  return { valence: 0.0, arousal: 0.4, label: 'neutral' };
}