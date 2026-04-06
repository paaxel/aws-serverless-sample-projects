import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { SettingsComponent } from './settings.component';
import { SettingsService } from '../../services/settings.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let settingsService: SettingsService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [
        SettingsComponent,
        RouterModule.forRoot([]),
      ],
      providers: [SettingsService, provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    settingsService = TestBed.inject(SettingsService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with saved = false', () => {
    expect(component.saved).toBe(false);
  });

  it('should save settings to service', () => {
    component.apiUrl = 'https://test-api.example.com/stream';
    component.apiKey = 'test-key-123';
    component.save();

    expect(settingsService.apiUrl).toBe('https://test-api.example.com/stream');
    expect(settingsService.apiKey).toBe('test-key-123');
    expect(component.saved).toBe(true);
  });
});
