import Raindrop from 'raindrop';

let client;

// Initialize Raindrop client
function initRaindrop() {
  if (!client) {
    client = new Raindrop({
      apiKey: process.env.RAINDROP_API_KEY
    });
  }
  return client;
}

// Raindrop AI Chat Completion
export async function generateRaindropResponse(userText, emotion) {
  const raindrop = initRaindrop();
  
  const response = await raindrop.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant focused on productivity and emotional support. Give brief, actionable responses.'
      },
      {
        role: 'user', 
        content: userText
      }
    ],
    max_tokens: 150,
    temperature: 0.7
  });

  return response.choices[0].message.content.trim();
}

// Raindrop AI Speech-to-Text
export async function transcribeRaindrop(audioBuffer) {
  const raindrop = initRaindrop();
  
  const response = await raindrop.audio.transcriptions.create({
    model: 'whisper-1',
    file: audioBuffer
  });

  return response.text || '';
}