import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ChatComponent } from './chat.component';
import { ChatService } from '../../services/chat.service';
import { SettingsService } from '../../services/settings.service';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ChatComponent,
        RouterModule.forRoot([]),
      ],
      providers: [ChatService, SettingsService, provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty messages', () => {
    expect(component.messages().length).toBe(0);
  });

  it('should start with streaming false', () => {
    expect(component.streaming()).toBe(false);
  });

  it('should start with empty prompt', () => {
    expect(component.prompt).toBe('');
  });

  it('should start with empty error', () => {
    expect(component.error()).toBe('');
  });

  it('should not send empty message', async () => {
    component.prompt = '   ';
    await component.send(new Event('submit'));
    expect(component.messages().length).toBe(0);
  });
});
