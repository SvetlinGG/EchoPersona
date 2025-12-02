import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-persona-studio',
  standalone: true,
  imports: [],
  templateUrl: './persona-studio.component.html',
  styleUrl: './persona-studio.component.css'
})
export class PersonaStudioComponent {
  prompt = signal<string>('Be calm, empathetic, speak briefly and encouragingly.');
  
  updatePrompt(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.prompt.set(target.value);
  }
  save(){ /* POST /persona */ }
}
