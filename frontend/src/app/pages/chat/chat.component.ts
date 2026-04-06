import {
  Component,
  signal,
  ElementRef,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ChatService } from '../../services/chat.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-chat',
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('messagesEl') private messagesEl!: ElementRef<HTMLDivElement>;

  messages;
  streaming = signal(false);
  streamBuffer = signal('');
  error = signal('');
  prompt = '';

  private abortCtrl: AbortController | null = null;

  constructor(
    protected settings: SettingsService,
    private chatService: ChatService
  ) {
    this.messages = this.chatService.messages;
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private now(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async send(e: Event) {
    e.preventDefault();
    await this.sendMessage();
  }

  onEnter(event: Event) {
    if (!(event as KeyboardEvent).shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private async sendMessage() {
    const text = this.prompt.trim();
    if (!text || this.streaming() || !this.settings.isConfigured) return;

    this.prompt = '';
    this.error.set('');
    // chat in this chatbot is restarted on every new message, so we clear the history here
    // if you want to keep the history use:  this.chatService.messages.update((m) => [...m, { role: 'user', content: text, time: this.now() }]);
    this.chatService.messages.update((m) => [{ role: 'user', content: text, time: this.now() }]);
    this.streaming.set(true);
    this.streamBuffer.set('');

    try {
      const { chunks, abort } = this.chatService.stream(text);
      this.abortCtrl = abort;

      let full = '';
      for await (const chunk of chunks) {
        full += chunk;
        this.streamBuffer.set(full);
      }

      this.chatService.messages.update((m) => [...m, { role: 'assistant', content: full, time: this.now() }]);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        this.error.set(err.message ?? String(err));
      }
      const partial = this.streamBuffer();
      if (partial) {
        this.chatService.messages.update((m) => [...m, { role: 'assistant', content: partial, time: this.now() }]);
      }
    } finally {
      this.streaming.set(false);
      this.streamBuffer.set('');
      this.abortCtrl = null;
    }
  }

  stop() {
    this.abortCtrl?.abort();
  }

  private scrollToBottom() {
    const el = this.messagesEl?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}


