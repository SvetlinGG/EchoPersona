import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { VoiceCaptureComponent } from '../voice-capture/voice-capture.component';
import { WsService } from '../../../core/services/ws.service';
import { ChatMessage } from '../../../core/services/models/conversation';

@Component({
  selector: 'app-conversation-view',
  standalone: true,
  imports: [CommonModule, VoiceCaptureComponent],
  templateUrl: './conversation-view.component.html',
  styleUrl: './conversation-view.component.css'
})
export class ConversationViewComponent {

  private ws = inject(WsService);
  message = signal<ChatMessage[]>([]);

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

  private upsertPartial(role: 'user' | 'assistant', text: string){
    const items = 

  }

}
