import fetch from 'node-fetch';

export async function generateOpenAIResponse(userText, emotion) {
  const messages = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant focused on productivity and emotional support. Give brief, actionable responses.'
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
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 150,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}