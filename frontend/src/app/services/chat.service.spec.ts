import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat.service';
import { SettingsService } from './settings.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('bedrock_api_key', 'test-key');

    TestBed.configureTestingModule({
      providers: [ChatService, SettingsService],
    });
    service = TestBed.inject(ChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty messages', () => {
    expect(service.messages().length).toBe(0);
  });

  it('should clear messages', () => {
    service.messages.set([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ]);
    expect(service.messages().length).toBe(2);
    service.clearMessages();
    expect(service.messages().length).toBe(0);
  });

  it('should return stream object with chunks and abort', () => {
    const result = service.stream('test prompt');
    expect(result.chunks).toBeDefined();
    expect(result.abort).toBeInstanceOf(AbortController);
    result.abort.abort();
  });
});
