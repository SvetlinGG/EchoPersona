import fetch from 'node-fetch';
import FormData from 'form-data';

// LiquidMetal AI Chat Completion
export async function generateLiquidMetalResponse(userText, emotion) {
  const response = await fetch('https://api.liquidmetal.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LIQUIDMETAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are EchoPersona, an emotionally intelligent AI voice companion built for The AI Champion Ship hackathon. The user's detected emotion is: ${emotion?.label || 'neutral'}. Respond with empathy, understanding, and actionable micro-steps. Keep responses under 40 words and focus on breaking overwhelming tasks into tiny, achievable actions. Match their emotional energy.`
        },
        {
          role: 'user', 
          content: userText
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`LiquidMetal AI failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// LiquidMetal AI Speech-to-Text
export async function transcribeLiquidMetal(audioBuffer) {
  const form = new FormData();
  form.append('model', 'whisper-1');
  form.append('file', audioBuffer, { filename: 'audio.wav', contentType: 'audio/wav' });

  const response = await fetch('https://api.liquidmetal.ai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${process.env.LIQUIDMETAL_API_KEY}`,
      ...form.getHeaders()
    },
    body: form
  });

  if (!response.ok) {
    throw new Error(`LiquidMetal STT failed: ${response.status}`);
  }

  const data = await response.json();
  return data.text || '';
}