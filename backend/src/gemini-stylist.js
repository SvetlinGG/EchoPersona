// Gemini Flash Persona Stylist Agent
import fetch from 'node-fetch';

export class PersonaStylistAgent {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent';
  }

  async styleResponse(rawResponse, emotion, persona = 'coach') {
    const personaPrompts = {
      coach: "supportive coach",
      therapist: "understanding therapist", 
      motivator: "encouraging friend",
      friend: "caring friend"
    };

    const emotionContext = {
      stressed: "The user is feeling overwhelmed and needs calm, step-by-step guidance.",
      happy: "The user is in a positive mood and ready for action.",
      sad: "The user needs gentle encouragement and emotional support.",
      energetic: "The user has high energy and motivation to tackle challenges.",
      neutral: "The user is in a balanced state and open to guidance."
    };

    const prompt = `You are having a natural conversation with someone who just said something to you. Respond as a helpful ${persona} would.

What they said: "${rawResponse.replace('Original response: "', '').replace('"', '')}"
Their emotional state: ${emotion.label}

Respond naturally in 1-2 sentences (under 30 words). Be conversational, not robotic. Don't repeat their words back to them.

Response:`;

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
    // Just return the original text with minimal styling
    if (emotion.label === 'stressed') {
      return text.replace(/!/g, '.').toLowerCase();
    }
    return text;
  }
}

export default PersonaStylistAgent;