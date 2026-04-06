import { Routes } from '@angular/router';
import { ChatComponent } from './pages/chat/chat.component';
import { SettingsComponent } from './pages/settings/settings.component';

export const routes: Routes = [
  { path: '', component: ChatComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '' },
];
