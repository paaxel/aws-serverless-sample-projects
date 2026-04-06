import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

const STORAGE_KEY_API_KEY = 'bedrock_api_key';
const STORAGE_KEY_API_URL = 'bedrock_api_url';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  get apiKey(): string {
    return localStorage.getItem(STORAGE_KEY_API_KEY) ?? '';
  }
  set apiKey(value: string) {
    localStorage.setItem(STORAGE_KEY_API_KEY, value);
  }

  get apiUrl(): string {
    return localStorage.getItem(STORAGE_KEY_API_URL) || environment.defaultApiUrl;
  }
  set apiUrl(value: string) {
    localStorage.setItem(STORAGE_KEY_API_URL, value);
  }

  get isConfigured(): boolean {
    return this.apiKey.length > 0;
  }
}
