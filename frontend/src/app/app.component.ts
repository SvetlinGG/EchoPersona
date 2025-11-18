import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';

  constructor(private router: Router) {}

  startNewChat() {
    // Navigate to conversation view and trigger new chat
    this.router.navigate(['/']);
    // Could emit event to clear conversation history
    window.location.reload(); // Simple approach to clear current chat
  }
}
