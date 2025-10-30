import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root'})
export class WsService {

  constructor() { }

  private ws?: WebSocket;
  isConnected = signal(false);

  connect(url: string, onMsg: (msg: any) => void){
    this.ws = new WebSocket(url);
    this.ws.binaryType = 'arraybuffer';
    this.ws.onopen = () => this.isConnected.set(true);
    this.ws.onclose = () => this.isConnected.set(false);
    this.ws.onmessage = (ev) => {
      try { onMsg(JSON.parse(ev.data));} catch (error) { onMsg(ev.data);}
    };
  }

  sendJson(obj: any){
    if ( this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(obj));
  }

  sendBinary( buf: ArrayBuffer | Blob){
    if ( this.ws?.readyState === WebSocket.OPEN) this.ws.send(buf);
  }
}
