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
}
