import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppComponent } from './app.component';
import { DEFAULT_LANG } from './i18n.config';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let translate: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterModule.forRoot([]),
      ],
      providers: [provideTranslateService({ lang: DEFAULT_LANG, fallbackLang: DEFAULT_LANG })],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    translate = TestBed.inject(TranslateService);
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have currentLang set', () => {
    expect(component.currentLang).toBeTruthy();
  });

  it('should return the translated key for currentSection on root route', () => {
    expect(component.currentSectionKey).toBe('nav.chat');
  });

  it('should have 4 supported languages', () => {
    expect(component.languages.length).toBe(4);
    expect(component.languages).toEqual(['en', 'fr', 'de', 'it']);
  });

  it('should change language and store in localStorage', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    component.changeLang('fr');
    expect(component.currentLang).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
    expect(spy).toHaveBeenCalledWith('app_language', 'fr');
    spy.mockRestore();
  });

  it('should toggle sidebar', () => {
    expect(component.sidebarOpen()).toBe(false);
    component.toggleSidebar();
    expect(component.sidebarOpen()).toBe(true);
    component.toggleSidebar();
    expect(component.sidebarOpen()).toBe(false);
  });
});
