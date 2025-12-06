// Lazy load Deepgram only when needed
let deepgram = null;

async function getDeepgramClient() {
  if (!deepgram && process.env.DEEPGRAM_API_KEY) {
    const { createClient } = await import('@deepgram/sdk');
    deepgram = createClient(process.env.DEEPGRAM_API_KEY);
  }
  return deepgram;
}

export async function transcribeWebmOpusBufferToText(buf) {
    if (!process.env.DEEPGRAM_API_KEY) {
        throw new Error('DEEPGRAM_API_KEY not configured');
    }
    
    if (!buf || buf.length < 1000) {
        throw new Error('Audio buffer too small or empty');
    }
    
    const client = await getDeepgramClient();
    if (!client) {
        throw new Error('DEEPGRAM_API_KEY not configured');
    }
    
    try {
        console.log('Deepgram API Key present:', !!process.env.DEEPGRAM_API_KEY);
        console.log('Buffer size:', buf.length);
        
        const { result, error } = await client.listen.prerecorded.transcribeFile(
            buf,
            {
                model: 'nova-2',
                language: 'en-US',
                smart_format: true,
                punctuate: true
            }
        );

        if (error) {
            console.error('Deepgram API error:', error);
            throw new Error(`Deepgram STT failed: ${error.message || error}`);
        }
        
        if (!result || !result.results) {
            throw new Error('No results from Deepgram');
        }
        
        const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
        console.log('Deepgram raw result:', JSON.stringify(result.results, null, 2));
        
        return transcript;
    } catch (err) {
        console.error('Deepgram transcription error details:', err);
        throw new Error(`Deepgram transcription error: ${err.message}`);
    }
}

export async function createRealtimeTranscription(onTranscript, onError) {
    const client = await getDeepgramClient();
    if (!client) {
        throw new Error('DEEPGRAM_API_KEY not configured');
    }
    
    const connection = client.listen.live({
        model: 'nova-2',
        language: 'en',
        smart_format: true,
        interim_results: true,
        endpointing: 300
    });

    connection.on('open', () => {
        console.log('Deepgram connection opened');
    });

    connection.on('Results', (data) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript) {
            onTranscript({
                text: transcript,
                is_final: data.is_final
            });
        }
    });

    connection.on('error', onError);

    return {
        send: (audioData) => connection.send(audioData),
        close: () => connection.finish()
    };
}