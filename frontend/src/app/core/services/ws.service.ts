import { Injectable, signal } from '@angular/core';

type MsgHandler = (msg: any) => void;
type BinHandler = (buf: ArrayBuffer) => void;

@Injectable({ providedIn: 'root'})
export class WsService {

  constructor() { }

  private ws?: WebSocket;
  isConnected = signal(false);
  private onMessage?: MsgHandler;
  private onBinary?: BinHandler;

  connect(url: string, onMsg?: MsgHandler, onBin?: BinHandler){
    console.log('Attempting to connect to:', url);
    this.onMessage = onMsg;
    this.onBinary = onBin;
    
    try {
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected.set(true);
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.isConnected.set(false);
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected.set(false);
      };
      
      this.ws.onmessage = (ev) => {
        if (typeof ev.data !== 'string') {
          this.onBinary?.(ev.data as ArrayBuffer);
          return;
   