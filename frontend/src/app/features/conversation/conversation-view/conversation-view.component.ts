import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { VoiceCaptureComponent } from '../voice-capture/voice-capture.component';

@Component({
  selector: 'app-conversation-view',
  standalone: true,
  imports: [CommonModule, VoiceCaptureComponent],
  templateUrl: './conversation-view.component.html',
  styleUrl: './conversation-view.component.css'
})
export class ConversationViewComponent {

}
