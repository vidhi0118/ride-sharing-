import { PassengerPaymentsComponent } from './passenger/passenger-payments/passenger-payments';
import { DriverRequestsComponent } from './rider/driver-requests/driver-requests';
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { HomeComponent } from './home/home';
import { RideOptionsComponent } from './passenger/ride-options/ride-options';
import { NotificationsComponent } from './passenger/notifications/notifications';
import { ResetPasswordComponent } from './reset-password/reset-password';
export const routes: Routes = [

    {
    path: '',
    component: HomeComponent
  },
  // 🔓 PUBLIC ROUTES
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login')
        .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register')
        .then(m => m.RegisterComponent)
  },
 {
    path: 'verify-otp',
    loadComponent: () =>
      import('./auth/verify-otp/verify-otp')
        .then(m => m.VerifyOtpComponent)
  },

  {
  path: 'map',
  loadComponent: () =>
    import('./map/map').then(m => m.Map)
},

{ path: 'reset-password', component: ResetPasswordComponent },
  // 🧍 PASSENGER
  {
    path: 'passenger/dashboard',
    loadComponent: () =>
      import('./passenger/dashboard/dashboard')
        .then(m => m.PassengerDashboardComponent),
    canActivate: [AuthGuard, RoleGuard('passenger')]
  },
  {
    path: 'passenger/search-ride',
    loadComponent: () =>
      import('./passenger/search-ride/search-ride')
        .then(m => m.SearchRideComponent),
    canActivate: [AuthGuard, RoleGuard('passenger')]
  },
  {
    path: 'passenger/ride-list',
    loadComponent: () =>
      import('./passenger/ride-list/ride-list')
        .then(m => m.RideListComponent),
    canActivate: [AuthGuard, RoleGuard('passenger')]
  },
  {
    path: 'passenger/my-bookings',
    loadComponent: () =>
      import('./passenger/my-bookings/my-bookings')
        .then(m => m.MyBookings),
    canActivate: [AuthGuard, RoleGuard('passenger')]
  },

  {
  path: 'passenger/my-requests',
  loadComponent: () =>
    import('./passenger/my-requests/my-requests')
      .then(m => m.MyRequestsComponent),
  canActivate: [AuthGuard, RoleGuard('passenger')]
},

 {
  path: 'passenger/view-drivers',
  loadComponent: () =>
    import('./passenger/view-drivers/view-drivers')
      .then(m => m.ViewDriversComponent),
  canActivate: [AuthGuard, RoleGuard('passenger')]
},

{
  path: 'passenger/set-route',
  loadComponent: () =>
    import('./passenger/set-route/set-route')
      .then(m => m.SetRouteComponent),
  canActivate: [AuthGuard, RoleGuard('passenger')]
},


{
  path: 'passenger/ride-options',
  loadComponent: () =>
    import('./passenger/ride-options/ride-options')
      .then(m => m.RideOptionsComponent),
  canActivate: [AuthGuard, RoleGuard('passenger')]
},

 {
    path: 'passenger/passenger-payments',
    component: PassengerPaymentsComponent
  },

{
  path: 'notifications',
  loadComponent: () =>
    import('./passenger/notifications/notifications')
      .then(m => m.NotificationsComponent),
  canActivate: [AuthGuard]
},

{
  path: 'passenger/track-ride',
  loadComponent: () =>
    import('./passenger/track-ride/track-ride')
      .then(m => m.TrackRideComponent),
  canActivate: [AuthGuard, RoleGuard('passenger')]
},

{
  path: 'passenger/live-track',
  loadComponent: () =>
    import('./passenger/live-track/live-track')
      .then(m => m.LiveTrackComponent),
  canActivate: [AuthGuard, RoleGuard('passenger')]
},
  // 🚗 DRIVER
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard')
        .then(m => m.Dashboard),
    canActivate: [AuthGuard, RoleGuard('driver')]
  },
  {
    path: 'add-ride',
    loadComponent: () =>
      import('./rider/add-ride/add-ride')
        .then(m => m.AddRideComponent),
    canActivate: [AuthGuard, RoleGuard('driver')]
  },
  {
    path: 'rider/my-rides',
    loadComponent: () =>
      import('./rider/my-rides/my-rides')
        .then(m => m.MyRides),
    canActivate: [AuthGuard, RoleGuard('driver')]
  },


  {
    path: 'driver-requests',
    component: DriverRequestsComponent
  },

  {
  path: 'rider/pending-requests',
  loadComponent: () =>
    import('./rider/pending-requests/pending-requests')
      .then(m => m.PendingRequestsComponent),
  canActivate: [AuthGuard, RoleGuard('driver')]
},

 {
  path: 'rider/driver-ride-history',
  loadComponent: () =>
    import('./rider/driver-ride-history/driver-ride-history')
      .then(m => m.DriverRideHistoryComponent),
  canActivate: [AuthGuard, RoleGuard('driver')]
},

 {
  path: 'rider/driver-ride-control',
  loadComponent: () =>
    import('./rider/driver-ride-control/driver-ride-control')
      .then(m => m.DriverRideControlComponent),
  canActivate: [AuthGuard, RoleGuard('driver')]
},

 {
  path: 'rider/driver-requests',
  loadComponent: () =>
    import('./rider/driver-requests/driver-requests')
      .then(m => m.DriverRequestsComponent),
  canActivate: [AuthGuard, RoleGuard('driver')]
 },

  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes')
        .then(m => m.adminRoutes)
  },
  {
    path: 'admin-login',
    loadComponent: () =>
      import('./admin/admin-login/admin-login')
        .then(m => m.AdminLoginComponent)
  },
  {
  path: 'verify-otp',
  loadComponent: () =>
    import('./auth/verify-otp/verify-otp')
      .then(m => m.VerifyOtpComponent)
},



  // 🌐 FALLBACK
  {
    path: '**',
    redirectTo: ''
  }
];
