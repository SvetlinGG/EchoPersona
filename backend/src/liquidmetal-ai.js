import fetch from 'node-fetch';
import FormData from 'form-data';

// AI Chat Completion with fallback
export async function generateLiquidMetalResponse(userText, emotion) {
  // For now, use intelligent template responses based on user input
  const emotionLabel = emotion?.label || 'neutral';
  
  // Analyze user input for better responses
  const input = userText.toLowerCase();
  
  if (input.includes('overwhelm') || input.includes('stress')) {
    return `I can sense you're feeling overwhelmed. Let's break this down: what's one tiny 2-minute task you could complete right now? Sometimes the smallest step creates the biggest momentum.`;
  }
  
  if (input.includes('productive') || input.includes('focus')) {
    return `Great question about productivity! Try the 2-minute rule: if something takes less than 2 minutes, do it now. For bigger tasks, what's the very first small action you could take?`;
  }
  
  if (input.includes('motivation') || input.includes('started')) {
    return `I hear you need some motivation! Here's what works: pick your easiest task first to build momentum. What's something simple you could accomplish in the next 5 minutes?`;
  }
  
  if (input.includes('project') || input.includes('break down')) {
    return `Let's tackle that project step by step! Start by writing down 3 main parts of the project. Then pick the smallest piece. What would that be?`;
  }
  
  if (input.includes('prioritize') || input.includes('organize')) {
    return `Good thinking about priorities! Try this: list your top 3 tasks, then ask 'Which one, if completed, would make the biggest difference today?' Start there.`;
  }
  
  // Default response based on emotion
  const responses = {
    stressed: "I can hear the tension in your voice. Take a deep breath with me. What's one small thing you can control right now?",
    happy: "I love your positive energy! Let's channel that into action. What exciting goal are you working toward?",
    sad: "I'm here with you. Sometimes the gentlest step forward is the most powerful. What's one kind thing you could do for yourself?",
    energetic: "Your energy is contagious! This is perfect timing for tackling something important. What's your biggest priority right now?",
    neutral: "I'm listening. What's on your mind today? Let's find a way to move forward together."
  };
  
  return responses[emotionLabel] || responses.neutral;
}

// Fallback transcription
export async function transcribeLiquidMetal(audioBuffer) {
  // For demo purposes, use the simple transcribe function
  const { simpleTranscribe } = await import('./stt-simple.js');
  return await simpleTranscribe(audioBuffer);
}