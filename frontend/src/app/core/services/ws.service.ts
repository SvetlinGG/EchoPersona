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
    this.onMessage = onMsg;
    this.onBinary = onBin;
    this.ws = new WebSocket(url);
    this.ws.binaryType = 'arraybuffer';
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
