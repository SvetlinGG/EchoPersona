import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SpeechService {
  private recognition?: SpeechRecognition;
  isListening = signal(false);
  
  constructor() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  startListening(onResult: (text: string, isFinal: boolean) => void, onEnd: () => void) {
    if (!this.recognition) {
      console.error('Speech recognition not supported');
      return;
    }

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      onResult(result.transcript, result.isFinal);
    };

    this.recognition.onend = () => {
      this.isListening.set(false);
      onEnd();
    };

    this.recognition.start();
    this.isListening.set(true);
  }

  stopListening() {
    this.recognition?.stop();
    this.isListening.set(false);
  }
}