import fetch from "node-fetch";

export async function* elevenLabsTtsStream({ text, voiceId = '21m00Tcm4TlvDq8ikWAM', modelId = 'eleven_multilingual_v2'}){
    // REST streaming (chunked transfer) - reduced latency optimization
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=1`;
    const resp = await fetch( url, {
        method: 'POST',
        headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: { 
                stability: 0.8, 
                similarity_boost: 0.85, 
                style: 0.1, 
                use_speaker_boost: false
            }
        })
    });

    if ( !resp.ok || !resp.body){
        const msg = await resp.text().catch(() => '');
        throw new Error(`ElevenLabs TTS failed: ${resp.status} ${msg}`);
    }

   
    for await ( const chunk of resp.body){
        yield chunk;
    }
}