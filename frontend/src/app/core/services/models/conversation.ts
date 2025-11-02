export interface EmotionVector {
    [emotion: string]: number;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    text: string;
    timestamp: number;
    emotions?: EmotionVector;
    audioUrl?: string;
    partial?: boolean; 
}

export interface WsOutgoing {
    type: 'audioChunk' | 'command' | 'settings';
    payload: any;
}

export interface WsIncoming {
    type: 'partialTranscription' | 'finalTranscription' | 'assistantText' | 'emotion' | 'ttsChunk' | 'done';
    payload: any;
}