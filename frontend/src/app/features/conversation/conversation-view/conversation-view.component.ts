import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, type OnInit, type OnDestroy } from '@angular/core';
import { VoiceCaptureComponent } from '../voice-capture/voice-capture.component';
import { WsService } from '../../../core/services/ws.service';
import { ChatMessage, MessageRole } from '../../../core/services/models/conversation';

const WS_URL = 'ws://localhost:3001/ws' as const;

type WebSocketEventType = 'partialTranscription' | 'finalTranscription' | 'assistantText';

interface WebSocketEvent {
  readonly type: WebSocketEventType;
  readonly text: string;
  readonly final?: boolean;
}

type MessageHandler = () => void;
type MessageHandlerMap = Record<WebSocketEventType, MessageHandler>;

@Component({
  selector: 'app-conversation-view',
  standalone: true,
  imports: [CommonModule, VoiceCaptureComponent],
  templateUrl: './conversation-view.component.html',
  styleUrl: './conversation-view.component.css'
})
export class ConversationViewComponent implements OnInit, OnDestroy {
  private readonly wsService = inject(WsService);
  
  readonly messages = signal<readonly ChatMessage[]>([]);
  readonly isConnected = this.wsService.isConnected;
  readonly messageCount = computed(() => this.messages().length);
  readonly hasPartialMessage = computed(() => 
    this.messages().some(msg => msg.partial)
  );

  ngOnInit(): void {
    this.initializeWebSocketConnection();
  }

  ngOnDestroy(): void {
    // WebSocket cleanup handled by browser on component destruction
  }

  private initializeWebSocketConnection(): void {
    this.wsService.connect(WS_URL, this.handleWebSocketMessage.bind(this));
  }

  private handleWebSocketMessage(event: WebSocketEvent): void {
    const messageHandlers: MessageHandlerMap = {
      partialTranscription: () => this.handleUserTranscription(event.text, false),
      finalTranscription: () => this.handleUserTranscription(event.text, true),
      assistantText: () => this.handleAssistantMessage(event)
    };

    messageHandlers[event.type]?.();
  }

  private handleUserTranscription(text: string, isFinal: boolean): void {
    if (isFinal) {
      this.confirmPartialMessage('user', text);
    } else {
      this.upsertPartialMessage('user', text);
    }
  }

  private handleAssistantMessage(event: WebSocketEvent): void {
    this.upsertPartialMessage('assistant', event.text);
    if (event.final) {
      this.confirmPartialMessage('assistant', event.text);
    }
  }

  private upsertPartialMessage(role: MessageRole, text: string): void {
    this.messages.update(messages => {
      const lastMessage = messages.at(-1);
      
      return this.shouldUpdateLastMessage(lastMessage, role)
        ? this.updateLastMessage(messages, lastMessage!, text)
        : this.addNewMessage(messages, role, text, true);
    });
  }

  private shouldUpdateLastMessage(
    lastMessage: ChatMessage | undefined, 
    role: MessageRole
  ): boolean {
    return Boolean(lastMessage?.role === role && lastMessage.partial);
  }

  private updateLastMessage(
    messages: readonly ChatMessage[], 
    lastMessage: ChatMessage, 
    text: string
  ): readonly ChatMessage[] {
    return [...messages.slice(0, -1), { ...lastMessage, text }];
  }

  private addNewMessage(
    messages: readonly ChatMessage[], 
    role: MessageRole, 
    text: string, 
    partial: boolean
  ): readonly ChatMessage[] {
    return [...messages, this.createMessage(role, text, partial)];
  }

  private confirmPartialMessage(role: MessageRole, text: string): void {
    this.messages.update(messages =>
      messages.map(message => 
        this.isPartialMessageOfRole(message, role)
          ? this.finalizeMessage(message, text)
          : message
      )
    );
  }

  private isPartialMessageOfRole(message: ChatMessage, role: MessageRole): boolean {
    return message.role === role && Boolean(message.partial);
  }

  private finalizeMessage(message: ChatMessage, text: string): ChatMessage {
    return { ...message, text, partial: false };
  }

  private createMessage(
    role: MessageRole, 
    text: string, 
    partial: boolean
  ): ChatMessage {
    return {
      id: crypto.randomUUID(),
      role,
      text,
      timestamp: Date.now(),
      partial
    } as const;
  }
}
