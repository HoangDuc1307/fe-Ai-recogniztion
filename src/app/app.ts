import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './page/sign-in/login.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule,LoginComponent],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent {
  constructor(public router: Router) {}
}
