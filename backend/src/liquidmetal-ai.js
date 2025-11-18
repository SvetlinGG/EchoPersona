import fetch from 'node-fetch';
import FormData from 'form-data';

// AI Chat Completion with proper conversational responses
export async function generateLiquidMetalResponse(userText, emotion) {
  const input = userText.toLowerCase().trim();
  const emotionLabel = emotion?.label || 'neutral';
  
  // Analyze the actual question and provide relevant responses
  
  // Greeting responses - only for actual greetings
  if ((input.startsWith('hello') || input.startsWith('hi ') || input.startsWith('hey ')) && input.length < 20) {
    return `Hello! I'm EchoPersona, your AI companion. I'm here to help you stay productive and motivated. What's on your mind today?`;
  }
  
  // How are you questions
  if (input.includes('how are you') || input.includes('how do you feel')) {
    return `I'm doing well, thank you for asking! I'm energized and ready to help you tackle whatever challenges you're facing. How are you feeling today?`;
  }
  
  // Time-related questions
  if (input.includes('what time') || input.includes('what day')) {
    const now = new Date();
    return `It's currently ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}. How can I help you make the most of your time today?`;
  }
  
  // Work and productivity questions
  if (input.includes('work') || input.includes('job') || input.includes('productive')) {
    return `I understand you're thinking about work and productivity. What specific work challenge are you facing right now? I can help you break it down into manageable steps.`;
  }
  
  // Stress and overwhelm
  if (input.includes('stress') || input.includes('overwhelm') || input.includes('anxious')) {
    return `I can sense you're feeling stressed. That's completely normal. Let's take this one step at a time. What's the main thing that's causing you stress right now?`;
  }
  
  // Motivation questions
  if (input.includes('motivat') || input.includes('inspire') || input.includes('energy')) {
    return `I hear you're looking for motivation! Here's what I know: motivation comes from action, not the other way around. What's one small thing you could do right now to get started?`;
  }
  
  // Focus and concentration
  if (input.includes('focus') || input.includes('concentrate') || input.includes('distract')) {
    return `Focus can be challenging in our busy world. Try this: pick one specific task, set a timer for 25 minutes, and work on just that. What task would you like to focus on?`;
  }
  
  // Planning and organization
  if (input.includes('plan') || input.includes('organize') || input.includes('schedule')) {
    return `Great thinking about planning! The key is to start simple. What's the most important thing you need to accomplish today? Let's build a plan around that.`;
  }
  
  // Goals and dreams
  if (input.includes('goal') || input.includes('dream') || input.includes('achieve')) {
    return `I love that you're thinking about goals! The best goals are specific and actionable. What goal are you working toward, and what's one small step you could take today?`;
  }
  
  // Questions about the app or AI
  if (input.includes('what are you') || input.includes('who are you') || input.includes('what can you do')) {
    return `I'm EchoPersona, your AI voice companion. I'm designed to help you stay productive, motivated, and focused. I can help you break down tasks, manage stress, and find your motivation. What would you like help with?`;
  }
  
  // Help requests - be more specific
  if (input.includes('help me') || input.includes('can you help') || input.includes('need help') || input.includes('support') || input.includes('assist')) {
    return `I'm absolutely here to help! I specialize in productivity, motivation, and breaking down overwhelming tasks into manageable steps. What specific area would you like support with?`;
  }
  
  // Sadness and emotional support
  if (input.includes('sad') || input.includes('down') || input.includes('depressed') || input.includes('feel bad')) {
    return `I can hear that you're going through a tough time. It's completely okay to feel sad sometimes. What's one small thing that might help you feel just a little bit better right now?`;
  }
  
  // General feelings - be more specific
  if (input.includes('i feel') || input.includes('feeling') || input.includes('emotion') || input.includes('mood')) {
    return `Your feelings are important. I can sense from your voice that you're feeling ${emotionLabel}. What's going on that's making you feel this way?`;
  }
  
  // Better responses - analyze the content more specifically
  if (input.includes('better') || input.includes('improve')) {
    return `I understand you want to feel or do better. That's a great mindset! What specific area of your life would you like to improve? Let's start with one small step.`;
  }
  
  if (input.includes('today') || input.includes('right now')) {
    return `You're focused on today - that's smart! Living in the present moment is powerful. What's the most important thing you want to accomplish today?`;
  }
  
  if (input.includes('something') && input.includes('good')) {
    return `You're looking for something positive - I love that! Here's something good: you're taking action by reaching out. What kind of good thing are you hoping for today?`;
  }
  
  // Default conversational response that acknowledges what they said
  return `I heard you say "${userText}". That sounds important to you. Can you tell me more about what's on your mind? I'm here to help you work through it.`;
}

// Fallback transcription
export async function transcribeLiquidMetal(audioBuffer) {
  // For demo purposes, use the simple transcribe function
  const { simpleTranscribe } = await import('./stt-simple.js');
  return await simpleTranscribe(audioBuffer);
}