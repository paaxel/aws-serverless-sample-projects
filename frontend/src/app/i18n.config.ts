export const SUPPORTED_LANGS = ['en', 'fr', 'de', 'it'];
export const DEFAULT_LANG = 'en';
export const STORAGE_KEY = 'app_language';

export function getInitialLang(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGS.includes(stored)) {
    return stored;
  }

  const browserLang = navigator.language.split('-')[0];
  return SUPPORTED_LANGS.includes(browserLang) ? browserLang : DEFAULT_LANG;
}