import { createClient } from '@deepgram/sdk';

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export async function transcribeWebmOpusBufferToText(buf) {
    try {
        const { result, error } = await deepgram.listen.prerecorded.transcribeBuffer(
            buf,
            {
                mimetype: 'audio/webm',
                model: 'nova-2',
                language: 'en',
                smart_format: true,
                punctuate: true
            }
        );

        if (error) {
            throw new Error(`Deepgram STT failed: ${error.message}`);
        }

        return result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    } catch (err) {
        throw new Error(`Deepgram transcription error: ${err.message}`);
    }
}

export function createRealtimeTranscription(onTranscript, onError) {
    const connection = deepgram.listen.live({
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