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
  ws = inject(WsService); // Make public for template
  private tts = inject(TtsService);
  messages = signal<{role:'user'|'assistant'; text:string}[]>([]);
  private msrc: ReturnType<TtsService['createMediaSource']> | null = null;

  constructor() {
    
    this.ws.connect('ws://localhost:3000/ws',
      
      (msg) => {
        console.log('Received WebSocket message:', msg);
        switch (msg.type) {
          case 'partialTranscription':
            if (msg.text) this.upsert('user', msg.text, true);
            break;
          case 'finalTranscription':
            this.upsert('user', msg.text, false);
            break;
          case 'assistantText':
            this.upsert('assistant', msg.text, false);
            break;
          case 'hello':
            console.log('Connected to server:', msg.payload);
            break;
          default:
            console.log('Unknown message type:', msg.type);
        }
      },
      
      (buf) => this.msrc?.append(buf)
    );
  }



  private upsert(role:'user'|'assistant', text:string, partial:boolean){
    console.log('Upserting message:', {role, text, partial});
    const list = this.messages();
    const last = list[list.length-1];
    
    if (last && last.role === role && partial) {
      const updated = [...list.slice(0, -1), {...last, text}];
      this.messages.set(updated);
    } else {
      this.messages.set([...list, {role, text}]);
    }
    
    console.log('Current messages:', this.messages());
  }
}
