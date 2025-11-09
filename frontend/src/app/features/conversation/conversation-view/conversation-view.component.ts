import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, type OnInit } from '@angular/core';
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

  private upsert(role:'user'|'assistant', text:string, partial:boolean){
    const list = this.messages();
    const last = list[list.length-1];
    if (last && last.role===role && partial) {
      last.text = text; this.messages.set([...list]);
    } else if (partial) {
      this.messages.set([...list, {role, text}]);
    } else {
      this.messages.set([...list, {role, text}]);
    }
  }
}
