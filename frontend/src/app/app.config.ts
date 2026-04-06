import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { DEFAULT_LANG, getInitialLang } from './i18n.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideTranslateService({
      lang: getInitialLang(),
      fallbackLang: DEFAULT_LANG,
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
      }),
    }),
  ],
};
