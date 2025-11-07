import { generateToneWavDataUrl } from './utils/wavTone.js';

export function handleWsConnection(ws){
    send(ws, { type: 'hello', payload: {server: 'EchoPersona WS'} });

    let collecting = false;
    let audioBytes = 0;

    ws.on('message', (data, isBinary) => {
        if ( isBinary ){
            audioBytes += data.byteLength;
            return;
        }

        let msg;
        try { msg = JSON.parse(data.toString()); } catch (error) { return; }

        if ( msg.type === 'beginUtterance') collecting = true;
        if ( msg.type === 'endUtterance' ) {
            collecting = false;
            simulateResponse(ws);
        }
        if ( msg.type === 'settings') {
            send(ws, { type: 'assistantText', text: 'Settings received.', final: true});
        }
    });

    ws.on('close', () => console.log('WS: the client disconnected'))
}

function send(ws, obj){
    if ( ws.readyState === ws.OPEN ) ws.send(JSON.stringify(obj));
}

//Simulate STT emotion -> LLM -> TTS (mock pipeline)

function simulateResponse(ws){

    // 1) Partial /final transcription

    setTimeout(() => send(ws, { type: 'partialTranscription', text: 'I think today...' }), 200);
    setTimeout(() => send(ws, { type: 'finalTranscription', text: 'I think I need motivation today..' }), 600);

    // 2) Emotion
    setTimeout(() => send(ws, { type: 'emotion', payload: { valence: -0.1, arousal: 0.6, label: 'stressed' } }), 800);

    // 3) Assistant partial / final
    setTimeout(() => send(ws, { type: 'assistantText', text: "I understand you. Let's start with a small step...", final: false }), 1100);
    setTimeout(() => send(ws, { type: 'assistantText', text: "I understand you. Let's start with a small step: Choose a 5-minute task and start a timer. Are you ready?", final: true}), 1600);

    // 4) TTS ( data  URL mock)
    const url = generateToneWavDataUrl(0.7, 440);
    setTimeout(() => {
        send(ws, { type: 'ttsHeader', payload: { mode: 'url' } });
        send(ws, { type: 'ttsUrl', payload: { url } });
        send(ws, { type: 'done' });
    }, 2000);
}
