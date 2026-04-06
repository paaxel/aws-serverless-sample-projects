import { Component, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatService } from './services/chat.service';
import { STORAGE_KEY, getInitialLang, SUPPORTED_LANGS } from './i18n.config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule, FormsModule, UpperCasePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly languages = SUPPORTED_LANGS;
  currentLang: string;
  sidebarOpen = signal(false);

  constructor(
    private router: Router,
    private chatService: ChatService,
    private translate: TranslateService
  ) {
    this.currentLang = getInitialLang();
    this.translate.use(this.currentLang);
    this.syncDocumentLang(this.currentLang);
  }

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  get currentSectionKey(): string {
    return this.router.url.startsWith('/settings') ? 'nav.settings' : 'nav.chat';
  }

  changeLang(lang: string) {
    this.currentLang = lang;
    this.translate.use(lang);
    this.syncDocumentLang(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  private syncDocumentLang(lang: string) {
    document.documentElement.lang = lang;
  }

  newChat() {
    this.chatService.clearMessages();
    this.router.navigate(['/']);
  }
}
