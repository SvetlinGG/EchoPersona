import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root'})
export class AudioService {
  constructor() { }
  private stream?: MediaStream;
  private recorder?: MediaRecorder;
  private chunkMs = 400;
  isRecording = signal(false);

  async start( onChunk: (blob: Blob) => void){
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: {echoCancellation: true, noiseSuppression: true}});
    this.recorder = new MediaRecorder(this.stream, {mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 48000 });
    this.recorder.ondataavailable = (e) => e.data.size && onChunk(e.data);
    this.recorder.start(this.chunkMs);
    this.isRecording.set(true)
  }

  stop(){
    this.recorder?.stop();
    this.stream?.getTracks().forEach(t => t.stop());
    this.isRecording.set(false);
  }
}
