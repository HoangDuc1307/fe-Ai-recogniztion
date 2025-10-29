
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { HeaderAdminComponent } from '../../layout/header/header.component';


@Component({
  selector: 'app-userlist',
  standalone: true,
  imports:[CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderAdminComponent],
  templateUrl:'userlist.component.html',
  styleUrls: ['./userlist.component.css'],
  

})
export class UserListComponent {

}
