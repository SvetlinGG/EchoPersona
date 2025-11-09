import { Component, inject, Output, EventEmitter } from '@angular/core';
import { SpeechService } from '../../../core/services/speech.service';

@Component({
  selector: 'app-voice-capture',
  standalone: true,
  imports: [],
  templateUrl: './voice-capture.component.html',
  styleUrl: './voice-capture.component.css'
})
export class VoiceCaptureComponent {
  speech = inject(SpeechService);
  @Output() speechResult = new EventEmitter<{text: string, final: boolean}>();
  @Output() speechEnd = new EventEmitter<void>();

  toggle() {
    if (!this.speech.isListening()) {
      this.speech.startListening(
        (text, isFinal) => this.speechResult.emit({text, final: isFinal}),
        () => this.speechEnd.emit()
      );
    } else {
      this.speech.stopListening();
    }
  }
}
