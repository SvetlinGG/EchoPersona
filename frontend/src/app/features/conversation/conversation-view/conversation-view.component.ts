import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { VoiceCaptureComponent } from '../voice-capture/voice-capture.component';
import { WsService } from '../../../core/services/ws.service';
import { TtsService } from '../../../core/services/tts.service';
import { ChatService } from '../../../core/services/chat.service';

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
export class ConversationViewComponent implements OnInit {
  ws = inject(WsService); // Make public for template
  private tts = inject(TtsService);
  private chatService = inject(ChatService);
  messages = signal<{role:'user'|'assistant'; text:string}[]>([]);
  private msrc: ReturnType<TtsService['createMediaSource']> | null = null;

  ngOnInit() {
    // Load current chat messages if any
    const currentMessages = this.chatService.getCurrentMessages();
    if (currentMessages.length > 0) {
      const formattedMessages = currentMessages.map(msg => ({
        role: msg.role,
        text: msg.text
      }));
      this.messages.set(formattedMessages);
    }
  }

  constructor() {
    
    this.ws.connect('ws://localhost:3001/ws',
      
      (msg) => {
        console.log('Received WebSocket message:', msg);
        switch (msg.type) {
          case 'partialTranscription':
            if (msg.text && msg.text.trim()) {
              this.upsert('user', msg.text, true);
            }
            break;
          case 'finalTranscription':
            if (msg.text && msg.text.trim() && !msg.text.includes('[') && !msg.text.includes('No audio')) {
              this.upsert('user', msg.text, false);
            }
            break;
          case 'assistantText':
            if (msg.text && msg.text.trim()) {
              this.upsert('assistant', msg.text, false);
            }
            break;
          case 'hello':
            console.log('Connected to server:', msg.payload);
            break;
          case 'ttsHeader':
            console.log('Starting TTS playback');
            this.msrc = msg.payload?.mode === 'chunks'
              ? this.tts.createMediaSource(msg.payload?.mime ?? 'audio/mpeg')
              : null;
            break;
          case 'ttsUrl':
            console.log('Playing TTS from URL');
            this.tts.playUrl(msg.payload.url);
            break;
          case 'ttsText':
            console.log('Using browser TTS fallback');
            this.speakText(msg.text);
            break;
          case 'done':
            console.log('TTS playback complete');
            if (this.msrc) {
              this.msrc.play();
              this.msrc.end();
              this.msrc = null;
            }
            break;
          default:
            console.log('Unknown message type:', msg.type, msg);
        }
      },
      
      (buf) => this.msrc?.append(buf)
    );
  }

  private speakText(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.5;
      
      // Try to use a female voice
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      speechSynthesis.speak(utterance);
      console.log('Browser TTS started');
    } else {
      console.warn('Browser TTS not supported');
    }
  }



  private upsert(role:'user'|'assistant', text:string, partial:boolean){
    if (!text || text.trim() === '') return;
    
    console.log('Upserting message:', {role, text, partial});
    const list = this.messages();
    const last = list[list.length-1];
    
    if (last && last.role === role && partial) {
      const updated = [...list.slice(0, -1), {...last, text}];
      this.messages.set(updated);
    } else if (!partial || !last || last.role !== role) {
      this.messages.set([...list, {role, text}]);
    }
    
    console.log('Current messages:', this.messages());
  }
}
