import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
//import { routes } from './app.routes';
import { ConversationViewComponent } from './features/conversation/conversation-view/conversation-view.component';

const routes: Routes = [
  { path: '', component: ConversationViewComponent },
  { path: '**', redirectTo: ''}
]

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)]
};
