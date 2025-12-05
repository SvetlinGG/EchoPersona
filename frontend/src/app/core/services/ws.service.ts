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
    
    this.connectWithRetry(url);
  }

  private connectWithRetry(url: string, retryCount = 0) {
    try {
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.isConnected.set(true);
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.isConnected.set(false);
        
        // Retry connection after 2 seconds if not intentional close
        if (event.code !== 1000 && retryCount < 3) {
          console.log(`Retrying connection in 2s... (attempt ${retryCount + 1}/3)`);
          setTimeout(() => this.connectWithRetry(url, retryCount + 1), 2000);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnected.set(false);
      };
      
      this.ws.onmessage = (ev) => {
        if (typeof ev.data !== 'string') {
          this.onBinary?.(ev.data as ArrayBuffer);
          return;
        }
        try { 
          const obj = JSON.parse(ev.data as string);
          this.onMessage?.(obj);
        } catch (error) { 
          console.error('Failed to parse message:', ev.data);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isConnected.set(false);
    }
  }

  sendJson(obj: any){
    if ( this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(obj));
  }

  sendBinary( buf: ArrayBuffer | Blob){
    if ( this.ws?.readyState === WebSocket.OPEN) this.ws.send(buf);
  }
}
