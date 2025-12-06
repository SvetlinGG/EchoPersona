import fetch from 'node-fetch';

// Store conversation history per connection
export const conversationHistory = new Map();

export async function generateOpenAIResponse(userText, emotion, conversationId = 'default') {
  // Get or create conversation history
  if (!conversationHistory.has(conversationId)) {
    conversationHistory.set(conversationId, []);
  }
  const history = conversationHistory.get(conversationId);

  // Build messages with context
  const messages = [
    {
      role: 'system',
      content: `You're having a casual, friendly conversation with someone. Respond naturally like a real person would - use contractions, be conversational, and match their tone. Keep it to 1-2 short sentences. Don't be formal or robotic. Just talk naturally.`
    }
  ];

  // Add conversation history (last 3 exchanges for context)
  if (history.length > 0) {
    messages.push(...history.slice(-6)); // Last 3 exchanges (6 messages)
  }

  // Add current message
  messages.push({
    role: 'user',
    content: userText
  });

  // Update history
  history.push(
    { role: 'user', content: userText },
    { role: 'assistant', content: '' } // Will be filled after response
  );

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 80,
      temperature: 0.9, // Higher temperature for more natural variation
      presence_penalty: 0.3, // Encourage new topics
      frequency_penalty: 0.3 // Avoid repetition
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API failed: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.choices[0].message.content.trim();
  
  // Update history with the response
  if (history.length > 0) {
    history[history.length - 1].content = responseText;
  }
  
  // Keep history manageable (max 10 exchanges = 20 messages)
  if (history.length > 20) {
    history.splice(0, history.length - 20);
  }
  
  return responseText;
}