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
  audio = inject(AudioService);
  ws = inject(WsService);

  async toggle(){
    if (!this.audio.isRecording()){
      this.ws.sendJson({type: 'beginUtterance'});
      await this.audio.start((blob) => this.ws.sendBinary(blob));
    } else {
      this.audio.stop();
      this.ws.sendJson({type: 'endUtterance'});
    }
  }
}
