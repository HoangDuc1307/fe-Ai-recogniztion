import { Routes } from '@angular/router';
import { AttendanceComponent } from './attendance/attendance.component';
import { LoginComponent } from './page/sign-in/login.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderAdminComponent } from './layout/header/header.component';
import { HomeListComponent } from './admin/home/home-admin.component';
import { UserListComponent } from './admin/userlist/userlist.component';
import { AddUserComponent } from './admin/add user/adduser.component';

export const routes: Routes = [
  { path: '', component: AttendanceComponent },
  { path: 'login', component: LoginComponent },
  {path: 'sidebar', component: SidebarComponent},
  {path: 'header', component: HeaderAdminComponent},
  {path: 'homelist', component: HomeListComponent},
  {path: 'userlist', component: UserListComponent},
  {path: 'adduser', component: AddUserComponent},
];
