import fetch from "node-fetch";

export async function* elevenLabsTtsStream({ text, voiceId = 'Rachel', modelId = 'eleven_turbo_v2'}){
    // REST streaming (chunked transfer)
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=2`;
    const resp = await fetch( url, {
        method: 'POST',
        headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true}
        })
    });
    
}