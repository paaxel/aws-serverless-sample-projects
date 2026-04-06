import { Injectable, signal } from '@angular/core';
import { SettingsService } from './settings.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  time?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  messages = signal<ChatMessage[]>([]);

  constructor(private settings: SettingsService) {}

  clearMessages() {
    this.messages.set([]);
  }

  /**
   * Sends a prompt and yields streamed text chunks via an async generator.
   * The caller can abort via the returned AbortController.
   */
  stream(prompt: string, system?: string, maxTokens = 2048): {
    chunks: AsyncGenerator<string>;
    abort: AbortController;
  } {
    const abort = new AbortController();
    const chunks = this.doStream(prompt, abort.signal, system, maxTokens);
    return { chunks, abort };
  }

  private async *doStream(
    prompt: string,
    signal: AbortSignal,
    system?: string,
    maxTokens = 2048
  ): AsyncGenerator<string> {
    const response = await fetch(this.settings.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.settings.apiKey,
      },
      body: JSON.stringify({ prompt, system, maxTokens }),
      signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API ${response.status}: ${text}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop()!; // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.text) yield data.text;
          if (data.error) throw new Error(data.error);
          if (data.done) return;
        } catch (e) {
          if (e instanceof SyntaxError) continue; // skip malformed chunks
          throw e;
        }
      }
    }
  }
}
