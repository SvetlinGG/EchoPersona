import { Component, inject } from '@angular/core';
import { AudioService } from '../../../core/services/audio.service';
import { WsService } from '../../../core/services/ws.service';

@Component({
  selector: 'app-voice-capture',
  standalone: true,
  imports: [],
  templateUrl: './voice-capture.component.html',
  styleUrl: './voice-capture.component.css'
})
export class VoiceCaptureComponent {
  private audio = inject(AudioService);
  private ws = inject(WsService);

  recording = this.audio.isRecording;
  connected = this.ws.isConnected;

  constructor(){
    this.ws.connect('ws://localhost:3001/ws', () => {});
  }

  async toggle(){
    if (!this.recording()){
      await this.audio.start(async (blob) => {

        this.ws.sendBinary(blob);
      });
      this.ws.sendJson({type: 'beginUtterance'});
    }else {
      this.audio.stop();
      this.ws.sendJson({type: 'endUtterance'});
    }
  }
}
