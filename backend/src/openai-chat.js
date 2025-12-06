import fetch from 'node-fetch';

export async function generateOpenAIResponse(userText, emotion) {
  const emotionContext = {
    stressed: 'The user is feeling stressed or overwhelmed. Be calm, empathetic, and offer practical, step-by-step help.',
    happy: 'The user is in a positive mood. Match their energy and be encouraging.',
    sad: 'The user is feeling down. Be gentle, supportive, and offer comfort.',
    energetic: 'The user has high energy. Be enthusiastic and action-oriented.',
    neutral: 'The user is in a balanced state. Be friendly and helpful.'
  };

  const messages = [
    {
      role: 'system',
      content: `You are EchoPersona, a friendly AI voice companion. You have natural, conversational conversations with people. ${emotionContext[emotion?.label || 'neutral']} 

Keep responses to 1-2 sentences (under 40 words). Be natural, human-like, and conversational. Don't sound like a template or robot. Just have a normal, friendly conversation.`
    },
    {
      role: 'user', 
      content: userText
    }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 100,
      temperature: 0.8
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}