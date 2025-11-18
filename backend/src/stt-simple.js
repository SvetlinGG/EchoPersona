// Simple fallback transcription for testing
let transcriptionCounter = 0;

export async function simpleTranscribe(audioBuffer) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // More realistic transcriptions that vary based on usage
  const transcriptions = [
    "Hello, can you help me with something?",
    "I'm feeling a bit overwhelmed with my tasks today",
    "What's the best way to stay productive?",
    "I need some motivation to get started",
    "How can I break down this big project?",
    "I'm having trouble focusing, any suggestions?",
    "Can you help me prioritize my work?",
    "I'm feeling stressed about my deadlines",
    "What should I work on first?",
    "I need help organizing my thoughts"
  ];
  
  // Cycle through transcriptions to make it feel more natural
  const index = transcriptionCounter % transcriptions.length;
  transcriptionCounter++;
  
  return transcriptions[index];
}

// Convert WebM to WAV for better compatibility
export function convertWebmToWav(webmBuffer) {
  // This is a placeholder - in production you'd use ffmpeg
  // For now, just return the buffer as-is
  return webmBuffer;
}