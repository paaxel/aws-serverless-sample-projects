import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, TranslateModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  apiUrl: string;
  apiKey: string;
  saved = false;

  constructor(
    protected settings: SettingsService,
    private router: Router
  ) {
    this.apiUrl = this.settings.apiUrl;
    this.apiKey = this.settings.apiKey;
  }

  save() {
    this.settings.apiUrl = this.apiUrl;
    this.settings.apiKey = this.apiKey;
    this.saved = true;
    setTimeout(() => this.router.navigate(['/']), 1000);
  }
}
