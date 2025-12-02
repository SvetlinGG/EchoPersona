import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
  private themeService = inject(ThemeService);

  constructor(private router: Router) {
    // Initialize theme service to load saved theme
  }

  startNewChat() {
    // Navigate to conversation view and trigger new chat
    this.router.navigate(['/']);
    // Could emit event to clear conversation history
    window.location.reload(); // Simple approach to clear current chat
  }

  startTopicChat(topic: string) {
    console.log('Starting chat for topic:', topic);
    this.router.navigate(['/']);
    // Could store topic context for the conversation
    localStorage.setItem('echopersona-topic', topic);
  }

  openFolder(folder: string) {
    console.log('Opening folder:', folder);
    this.router.navigate(['/']);
    // Could filter conversations by folder
    localStorage.setItem('echopersona-folder', folder);
  }

  loadChat(chatName: string) {
    console.log('Loading chat:', chatName);
    this.router.navigate(['/']);
    // Could load specific chat history
    localStorage.setItem('echopersona-chat', chatName);
  }
}
