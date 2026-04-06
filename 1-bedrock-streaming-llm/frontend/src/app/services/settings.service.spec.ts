import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [SettingsService],
    });
    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty apiKey by default', () => {
    expect(service.apiKey).toBe('');
  });

  it('should store and retrieve apiKey', () => {
    service.apiKey = 'my-secret-key';
    expect(service.apiKey).toBe('my-secret-key');
    expect(localStorage.getItem('bedrock_api_key')).toBe('my-secret-key');
  });

  it('should store and retrieve apiUrl', () => {
    service.apiUrl = 'https://custom.api.com';
    expect(service.apiUrl).toBe('https://custom.api.com');
    expect(localStorage.getItem('bedrock_api_url')).toBe('https://custom.api.com');
  });

  it('should report not configured when no key', () => {
    expect(service.isConfigured).toBe(false);
  });

  it('should report configured when key exists', () => {
    service.apiKey = 'some-key';
    expect(service.isConfigured).toBe(true);
  });
});
