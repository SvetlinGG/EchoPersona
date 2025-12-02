import { Injectable, signal } from '@angular/core';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  name: string;
  messages: ChatMessage[];
  lastActivity: Date;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  currentChat = signal<Chat | null>(null);
  
  private mockChats: Chat[] = [
    {
      id: 'morning-motivation',
      name: 'Morning motivation',
      messages: [
        { role: 'user', text: 'I need some motivation to start my day', timestamp: new Date('2024-11-26T08:00:00') },
        { role: 'assistant', text: 'Good morning! Every new day is a fresh opportunity to make progress toward your goals. What\'s one small thing you could accomplish in the next hour that would make you feel proud?', timestamp: new Date('2024-11-26T08:00:30') },
        { role: 'user', text: 'Maybe I could organize my workspace', timestamp: new Date('2024-11-26T08:01:00') },
        { role: 'assistant', text: 'That\'s perfect! A clean workspace creates mental clarity. Start with just clearing your desk - it takes 5 minutes but makes a huge difference in how you feel about the day ahead.', timestamp: new Date('2024-11-26T08:01:30') }
      ],
      lastActivity: new Date('2024-11-26T08:01:30')
    },
    {
      id: 'project-planning',
      name: 'Project planning',
      messages: [
        { role: 'user', text: 'I have a big project and don\'t know where to start', timestamp: new Date('2024-11-25T14:00:00') },
        { role: 'assistant', text: 'Big projects can feel overwhelming, but every successful project starts with breaking it down. What\'s the main goal of this project?', timestamp: new Date('2024-11-25T14:00:30') },
        { role: 'user', text: 'I need to create a presentation for next week', timestamp: new Date('2024-11-25T14:01:00') },
        { role: 'assistant', text: 'Great! Let\'s break this down: 1) Outline your key points, 2) Gather supporting materials, 3) Create slides, 4) Practice delivery. Which step feels most manageable to start with today?', timestamp: new Date('2024-11-25T14:01:30') }
      ],
      lastActivity: new Date('2024-11-25T14:01:30')
    },
    {
      id: 'stress-relief',
      name: 'Stress relief session',
      messages: [
        { role: 'user', text: 'I\'m feeling really stressed about everything', timestamp: new Date('2024-11-24T16:00:00') },
        { role: 'assistant', text: 'I can hear the stress in your voice. Let\'s take this one breath at a time. Right now, take a deep breath in for 4 counts... hold for 4... and out for 6. You\'re safe in this moment.', timestamp: new Date('2024-11-24T16:00:30') },
        { role: 'user', text: 'That helps a little. I just have so much to do', timestamp: new Date('2024-11-24T16:01:00') },
        { role: 'assistant', text: 'When everything feels urgent, nothing gets the attention it deserves. What\'s ONE thing that, if completed today, would give you the biggest sense of relief?', timestamp: new Date('2024-11-24T16:01:30') }
      ],
      lastActivity: new Date('2024-11-24T16:01:30')
    },
    {
      id: 'goal-setting',
      name: 'Goal setting',
      messages: [
        { role: 'user', text: 'I want to set some goals but don\'t know how', timestamp: new Date('2024-11-23T10:00:00') },
        { role: 'assistant', text: 'Goal setting is powerful when done right! The best goals are specific, measurable, and broken into small steps. What area of your life would you like to improve?', timestamp: new Date('2024-11-23T10:00:30') },
        { role: 'user', text: 'I want to be more productive at work', timestamp: new Date('2024-11-23T10:01:00') },
        { role: 'assistant', text: 'Excellent focus area! Let\'s make this specific: What would "more productive" look like? Finishing tasks faster? Better focus? Less procrastination? Pick one aspect to start with.', timestamp: new Date('2024-11-23T10:01:30') }
      ],
      lastActivity: new Date('2024-11-23T10:01:30')
    }
  ];

  loadChat(chatName: string) {
    const chat = this.mockChats.find(c => c.name === chatName);
    if (chat) {
      this.currentChat.set(chat);
      return chat.messages;
    }
    return [];
  }

  startNewChat() {
    this.currentChat.set(null);
    return [];
  }

  getCurrentMessages() {
    return this.currentChat()?.messages || [];
  }
}