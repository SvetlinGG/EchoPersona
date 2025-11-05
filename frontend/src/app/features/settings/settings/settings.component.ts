import { Component, signal } from '@angular/core';
import { VoiceSettings } from '../../../core/services/models/settings';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  voice = signal<VoiceSettings>({ voiceId: 'eleven_monolingual_v1', rate: 1, pitch: 0, volume: 1});
  update<K extends keyof VoiceSettings>(k: K, v: VoiceSettings[K]){
    this.voice.set({...this.voice(), [k]: v});
  }

}
