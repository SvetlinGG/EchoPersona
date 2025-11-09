import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { VoiceCaptureComponent } from '../voice-capture/voice-capture.component';
import { WsService } from '../../../core/services/ws.service';
import { TtsService } from '../../../core/services/tts.service';

interface WsEvent {
  type: 'partialTranscription' | 'finalTranscription' | 'assistantText';
  text: string;
  final?: boolean;
}

@Component({
  selector: 'app-conversation-view',
  standalone: true,
  imports: [CommonModule, VoiceCaptureComponent],
  templateUrl: './conversation-view.component.html',
  styleUrl: './conversation-view.component.css'
})
export class ConversationViewComponent {
  private ws = inject(WsService);
  private tts = inject(TtsService);
  messages = signal<{role:'user'|'assistant'; text:string}[]>([]);
  private msrc: ReturnType<TtsService['createMediaSource']> | null = null;

  constructor() {
    
    this.ws.connect('ws://localhost:3001/ws',
      
      (msg) => {
        switch (msg.type) {
          case 'partialTranscription':
            this.upsert('user', msg.text, true); break;
          case 'finalTranscription':
            this.upsert('user', msg.text, false); break;
          case 'assistantText':
            this.upsert('assistant', msg.text, !msg.final); break;
          case 'ttsHeader':
            this.msrc = msg.payload?.mode === 'chunks'
              ? this.tts.createMediaSource(msg.payload?.mime ?? 'audio/mpeg')
              : null;
            break;
          case 'ttsUrl':
            this.tts.playUrl(msg.payload.url);
            break;
          case 'done':
            this.msrc?.play(); this.msrc?.end();
            break;
        }
      },
      
      (buf) => this.msrc?.append(buf)
    );
  }

  onSpeechResult(event: {text: string, final: boolean}) {
    this.upsert('user', event.text, !event.final);
  }

  onSpeechEnd() {
    const userText = this.messages().filter(m => m.role === 'user').pop()?.text || '';
    if (userText) {
      // Generate AI response
      const response = this.generateResponse(userText);
      this.upsert('assistant', response, false);
      
      // Convert to speech
      this.speakText(response);
    }
  }

  private generateResponse(userText: string): string {
    const text = userText.toLowerCase();
    if (text.includes('help') || text.includes('task')) {
      return "I understand you need help with tasks. Let's break it down: choose one small task and set a 5-minute timer. What would you like to work on first?";
    }
    if (text.includes('stress') || text.includes('difficult')) {
      return "I hear that you're feeling stressed. Take a deep breath. Let's start with something simple - what's one tiny step you can take right now?";
    }
    return "Great! I suggest focusing on one thing at a time. Pick your most important task and let's tackle it together. What's your priority right now?";
  }

  private speakText(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  }

  private upsert(role:'user'|'assistant', text:string, partial:boolean){
    const list = this.messages();
    const last = list[list.length-1];
    if (last && last.role===role && partial) {
      const updated = [...list.slice(0, -1), {...last, text}];
      this.messages.set(updated);
    } else {
      this.messages.set([...list, {role, text}]);
    }
  }
}
