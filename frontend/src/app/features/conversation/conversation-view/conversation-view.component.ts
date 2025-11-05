import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { VoiceCaptureComponent } from '../voice-capture/voice-capture.component';
import { WsService } from '../../../core/services/ws.service';
import { ChatMessage, MessageRole } from '../../../core/services/models/conversation';

@Component({
  selector: 'app-conversation-view',
  standalone: true,
  imports: [CommonModule, VoiceCaptureComponent],
  templateUrl: './conversation-view.component.html',
  styleUrl: './conversation-view.component.css'
})
export class ConversationViewComponent {

  private ws = inject(WsService);
  messages = signal<ChatMessage[]>([]);

  constructor(){
    this.ws.connect('ws://localhost:3001/ws', (msg) => this.handle(msg));
  }

  private handle(ev: any){
    switch(ev.type){
      case 'partialTranscription':
        this.upsertPartial('user', ev.text);
        break;
      case 'finalTranscription':
        this.confirmPartial('user', ev.text);
        break;
      case 'assistantText':
        this.upsertPartial('assistant', ev.text);
        if (ev.final) this.confirmPartial('assistant', ev.text);
        break;
    }
  }

  private upsertPartial(role: MessageRole, text: string){
    const items = this.messages();
    const last = items[items.length - 1];
    if (last && last.role === role && last.partial) {
      const updated = [...items.slice(0, -1), { ...last, text }];
      this.messages.set(updated);
    } else {
      const next: ChatMessage = { id: crypto.randomUUID(), role, text, timestamp: Date.now(), partial: true };
      this.messages.set([...items, next]);
    }
  }

  private confirmPartial(role: MessageRole, text: string) {
    const items = this.messages().map(m => 
      (m.role === role && m.partial) ? { ...m, text, partial: false } : m
    );
    this.messages.set(items);
  }
}
