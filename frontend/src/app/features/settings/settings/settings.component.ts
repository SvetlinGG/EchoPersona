import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceSettings } from '../../../core/services/models/settings';
import { ThemeService, Theme } from '../../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  themeService = inject(ThemeService);
  voice = signal<VoiceSettings>({ voiceId: 'eleven_monolingual_v1', rate: 1, pitch: 0, volume: 1});
  themes: Theme[] = ['pink', 'blue', 'gray', 'violet'];
  
  selectTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }
  
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
