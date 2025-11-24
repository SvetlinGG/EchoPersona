// Gemini Flash Persona Stylist Agent
import fetch from 'node-fetch';

export class PersonaStylistAgent {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
  }

  async styleResponse(rawResponse, emotion, persona = 'coach') {
    const personaPrompts = {
      coach: "You are a motivational coach. Rewrite this response to be energetic, encouraging, and action-focused. Use short, punchy sentences.",
      therapist: "You are an empathetic therapist. Rewrite this response to be calm, validating, and emotionally supportive. Use gentle, understanding language.",
      motivator: "You are an enthusiastic motivator. Rewrite this response to be high-energy, inspiring, and confidence-building. Use exciting, uplifting words.",
      friend: "You are a caring friend. Rewrite this response to be warm, casual, and supportive. Use friendly, conversational language."
    };

    const emotionContext = {
      stressed: "The user is feeling overwhelmed and needs calm, step-by-step guidance.",
      happy: "The user is in a positive mood and ready for action.",
      sad: "The user needs gentle encouragement and emotional support.",
      energetic: "The user has high energy and motivation to tackle challenges.",
      neutral: "The user is in a balanced state and open to guidance."
    };

    const prompt = `
${personaPrompts[persona] || personaPrompts.coach}

Context: ${emotionContext[emotion.label] || emotionContext.neutral}

Original response: "${rawResponse}"

Requirements:
- Keep it under 40 words
- Match the ${emotion.label} emotional state
- Sound natural and human
- Be actionable and specific
- Use the ${persona} persona style

Rewritten response:`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 100
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API failed: ${response.status}`);
      }

      const data = await response.json();
      const styledResponse = data.candidates[0].content.parts[0].text.trim();
      
      // Clean up any quotes or formatting
      return styledResponse.replace(/^["']|["']$/g, '').trim();

    } catch (error) {
      console.error('Gemini Stylist error:', error);
      // Fallback: basic persona styling
      return this.fallbackStyling(rawResponse, persona, emotion);
    }
  }

  fallbackStyling(text, persona, emotion) {
    const styles = {
      coach: {
        prefix: "Let's do this! ",
        suffix: " You've got this!",
        transform: (t) => t.replace(/\./g, '!').replace(/you should/g, "let's")
      },
      therapist: {
        prefix: "I understand. ",
        suffix: " Take your time.",
        transform: (t) => t.replace(/!/g, '.').replace(/must/g, "might want to")
      },
      motivator: {
        prefix: "Amazing! ",
        suffix: " You're unstoppable!",
        transform: (t) => t.replace(/\./g, '!').toUpperCase()
      },
      friend: {
        prefix: "Hey, ",
        suffix: " What do you think?",
        transform: (t) => t.replace(/you should/g, "maybe you could")
      }
    };

    const style = styles[persona] || styles.coach;
    let styled = style.transform(text);
    
    if (emotion.label === 'stressed') {
      styled = styled.toLowerCase().replace(/!/g, '.');
    }
    
    return `${style.prefix}${styled}${style.suffix}`;
  }
}

export default PersonaStylistAgent;