import { generateLiquidMetalResponse } from './liquidmetal-ai.js';
import { simpleTranscribe } from './stt-simple.js';
import { generateRealAnswer } from './real-answers.js';

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
      
      // Get transcription
      let transcript = '';
      try {
        transcript = await simpleTranscribe(full);
        console.log('Transcript:', transcript);
      } catch (error) {
        console.error('Transcription failed:', error);
        transcript = 'I heard you speaking';
      }
      
      send(ws, { type: 'finalTranscription', text: transcript });
      
      // Generate AI response
      let response;
      try {
        response = await generateLiquidMetalResponse(transcript, { label: 'neutral' });
      } catch (error) {
        console.error('AI response failed:', error);
        response = generateRealAnswer(transcript);
      }
      
      send(ws, { type: 'assistantText', text: response, final: true });
      
      // TTS fallback
      try {
        send(ws, { type: 'ttsText', text: response });
        send(ws, { type: 'done' });
      } catch (error) {
        console.error('TTS failed:', error);
        send(ws, { type: 'done' });
      }
    }
  });

  ws.on('close', () => {});
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}