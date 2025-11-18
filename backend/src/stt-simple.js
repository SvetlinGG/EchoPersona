// Simple fallback transcription for testing
export async function simpleTranscribe(audioBuffer) {
  // For demo purposes, return a mock transcription
  const mockTranscriptions = [
    "Hello, I'm testing the voice system",
    "How are you doing today?",
    "I need help with my work",
    "I'm feeling stressed about my tasks",
    "Can you help me stay motivated?",
    "What should I focus on right now?"
  ];
  
  // Return a random mock transcription
  const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
  return mockTranscriptions[randomIndex];
}

// Convert WebM to WAV for better compatibility
export function convertWebmToWav(webmBuffer) {
  // This is a placeholder - in production you'd use ffmpeg
  // For now, just return the buffer as-is
  return webmBuffer;
}