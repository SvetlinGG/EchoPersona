export type MessageRole = 'user' | 'assistant' | 'system';

export interface EmotionVector {
  readonly [emotion: string]: number;
}

export interface ChatMessage {
  readonly id: string;
  readonly role: MessageRole;
  readonly text: string;
  readonly timestamp: number;
  readonly emotions?: EmotionVector;
  readonly audioUrl?: string;
  readonly partial?: boolean;
}

export type WsOutgoingType = 'audioChunk' | 'command' | 'settings';
export type WsIncomingType = 'partialTranscription' | 'finalTranscription' | 'assistantText' | 'emotion' | 'ttsChunk' | 'done';

export interface WsOutgoing<T = unknown> {
  readonly type: WsOutgoingType;
  readonly payload: T;
}

export interface WsIncoming<T = unknown> {
  readonly type: WsIncomingType;
  readonly payload: T;
}