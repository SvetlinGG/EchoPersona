import { Injectable, signal } from '@angular/core';

export type Theme = 'pink' | 'blue' | 'gray' | 'violet';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  currentTheme = signal<Theme>('blue');

  setTheme(theme: Theme) {
    this.currentTheme.set(theme);
    document.body.className = `theme-${theme}`;
    localStorage.setItem('echopersona-theme', theme);
  }

  constructor() {
    const saved = localStorage.getItem('echopersona-theme') as Theme;
    if (saved) {
      this.setTheme(saved);
    } else {
      this.setTheme('blue');
    }
  }
}