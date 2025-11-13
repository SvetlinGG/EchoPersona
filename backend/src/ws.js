// src/ws.js
import { transcribeWebmOpusBufferToText } from './stt-whisper.js';
import { elevenLabsTtsStream } from './tts-eleven.js';
import { generateLiquidMetalResponse, transcribeLiquidMetal } from './liquidmetal-ai.js';

export function handleWsConnection(ws) {
  send(ws, { type: 'hello', payload: { server: 'EchoPersona WS (real STT/TTS)' } });

  let collecting = false;
  let audioBuffers = []; // we collect the incoming binary chunks

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
      // optional: send partialTranscription "" for UX
    }

    if (msg.type === 'endUtterance') {
      collecting = false;
      const full = Buffer.concat(audioBuffers);

      // (1) STT (LiquidMetal AI)
      let userText = '';
      try {
        userText = await transcribeLiquidMetal(full);
      } catch (e) {
        console.error('LiquidMetal STT error:', e);
        try {
          userText = await transcribeWebmOpusBufferToText(full);
        } catch (e2) {
          console.error('Fallback STT failed:', e2);
          send(ws, { type: 'finalTranscription', text: '[Failed transcription]' });
          return;
        }
      }
      send(ws, { type: 'finalTranscription', text: userText });

      // (2) Emotion
      const emo = fakeEmotionFromText(userText);
      send(ws, { type: 'emotion', payload: emo });

      // (3) Assistant text (LiquidMetal AI)
      let reply;
      try {
        reply = await generateLiquidMetalResponse(userText, emo);
      } catch (e) {
        console.error('LiquidMetal response error:', e);
        reply = craftAssistantReply(userText, emo);
      }
      send(ws, { type: 'assistantText', text: reply, final: true });

      // (4) ElevenLabs TTS → stream 
      send(ws, { type: 'ttsHeader', payload: { mode: 'chunks', mime: 'audio/mpeg' } });
      try {
        for await (const chunk of elevenLabsTtsStream({ text: reply })) {
          sendBinary(ws, chunk);
        }
      } catch (e) {
        console.error('TTS stream error:', e);
      }
      send(ws, { type: 'done' });
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
  if (t.includes('fatigue') || t.includes('difficult')) return { valence: -0.2, arousal: 0.5, label: 'stressed' };
  if (t.includes('joy') || t.includes('cool')) return { valence: 0.6, arousal: 0.6, label: 'happy' };
  return { valence: 0.0, arousal: 0.4, label: 'neutral' };
}


function craftAssistantReply(userText, emo) {
  
  if (emo.label === 'stressed') {
    return "I understand. Let's take a small first step: choose a simple 5-minute task and start a timer. Are you ready?";
  }
  return 'Great! I suggest two quick steps: 1) set a mini-goal for the next 5 minutes, 2) start a timer. Let me know how it goes.';
}

