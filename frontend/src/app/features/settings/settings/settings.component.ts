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
  
  updateVoiceId(event: Event) {
    const target = event.target as HTMLInputElement;
    this.voice.set({...this.voice(), voiceId: target.value});
  }
  
  updateRate(event: Event) {
    const target = event.target as HTMLInputElement;
    this.voice.set({...this.voice(), rate: parseFloat(target.value)});
  }
  
  updatePitch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.voice.set({...this.voice(), pitch: parseInt(target.value)});
  }
  
  update<K extends keyof VoiceSettings>(k: K, v: VoiceSettings[K]){
    this.voice.set({...this.voice(), [k]: v});
  }
}
