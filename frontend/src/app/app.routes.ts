import { Routes } from '@angular/router';
import { ConversationViewComponent } from './features/conversation/conversation-view/conversation-view.component';
import { PersonaStudioComponent } from './features/persona/persona-studio/persona-studio.component';
import { SettingsComponent } from './features/settings/settings/settings.component';

export const routes: Routes = [
  { path: '', component: ConversationViewComponent },
  { path: 'persona', component: PersonaStudioComponent },
  { path: 'settings', component: SettingsComponent }
];
