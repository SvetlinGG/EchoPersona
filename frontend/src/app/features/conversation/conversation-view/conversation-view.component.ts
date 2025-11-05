import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, type OnInit } from '@angular/core';
import { VoiceCaptureComponent } from '../voice-capture/voice-capture.component';
import { WsService } from '../../../core/services/ws.service';
import { ChatMessage, MessageRole } from '../../../core/services/models/conversation';

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
  private readonly ws = inject(WsService);
  
  readonly messages = signal<ChatMessage[]>([]);
  readonly isConnected = this.ws.isConnected;
  readonly messageCount = computed(() => this.messages().length);

  ngOnInit(): void {
    this.ws.connect('ws://localhost:3001/ws', (event: WsEvent) => {
      const handlers = {
        partialTranscription: () => this.upsert('user', event.text),
        finalTranscription: () => this.confirm('user', event.text),
        assistantText: () => {
          this.upsert('assistant', event.text);
          if (event.final) this.confirm('assistant', event.text);
        }
      };
      handlers[event.type]?.();
    });
  }



  private upsert(role: MessageRole, text: string): void {
    this.messages.update(msgs => {
      const last = msgs.at(-1);
      if (last?.role === role && last.partial) {
        return [...msgs.slice(0, -1), { ...last, text }];
      }
      return [...msgs, { id: crypto.randomUUID(), role, text, timestamp: Date.now(), partial: true }];
    });
  }

  private confirm(role: MessageRole, text: string): void {
    this.messages.update(msgs =>
      msgs.map(msg => 
        msg.role === role && msg.partial ? { ...msg, text, partial: false } : msg
      )
    );
  }
}
