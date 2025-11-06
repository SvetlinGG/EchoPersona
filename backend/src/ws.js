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