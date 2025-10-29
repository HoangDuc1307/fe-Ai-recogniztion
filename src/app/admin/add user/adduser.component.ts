import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { HeaderAdminComponent } from '../../layout/header/header.component';

@Component({
  selector: 'app-add_product',
  imports:[FormsModule,RouterModule,CommonModule,SidebarComponent,HeaderAdminComponent],
  templateUrl: './adduser.component.html',
  styleUrls: ['./adduser.component.css'],
  standalone: true,
})
export class AddUserComponent  {

}
