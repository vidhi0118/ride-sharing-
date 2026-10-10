import { Routes } from '@angular/router';
import { Admin } from './admin';
import { Dashboard } from './pages/dashboard/dashboard';
import { Users } from './pages/users/users';
import { Rides } from './pages/rides/rides';
import { SimpleAdminGuard } from '../guards/simple-admin.guard';
import { Payments } from './pages/payments/payments';
import { Drivers } from './pages/drivers/drivers';
import { DriverHistory } from './pages/driver-history/driver-history';
import { DriverAnalytics } from './pages/driver-analytics/driver-analytics';
import { AdminAnalytics } from './pages/admin-analytics/admin-analytics';

export const adminRoutes: Routes = [
  {
    path: '',
    component: Admin,
    canActivate: [SimpleAdminGuard],
    children: [
      { path: '', component: Dashboard },
      { path: 'users', component: Users },
      { path: 'rides', component: Rides },
      { path: 'payments', component: Payments },
      { path: 'drivers', component: Drivers },
     {
  path: 'driver-history',component: DriverHistory},
{  path: 'driver-analytics',component: DriverAnalytics},
{ path: 'admin-analytics', component: AdminAnalytics }
]
  }
];
