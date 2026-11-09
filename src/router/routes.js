const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../pages/CustomerHomePage.vue'),
      },
      {
        path: 'login',
        name: 'login',
        component: () => import('../pages/LoginPage.vue'),
      },

      { path: 'register', name: 'register', component: () => import('../pages/RegisterPage.vue') },
      {
        path: 'booking-waiting/:orderId',
        name: 'booking-waiting',
        component: () => import('../pages/BookingWaitingPage.vue'),
      },
      // หน้าแจ้งปัญหาบ้าน (Smart Diagnostic Page)
      {
        path: 'diagnostic',
        name: 'diagnostic',
        component: () => import('../pages/CustomerDiagnosticPage.vue'),
      },

      // หน้าติดตามสถานะช่าง
      {
        path: 'tracking/:orderId',
        name: 'tracking',
        component: () => import('../pages/TechnicianTrackingPage.vue'),
      },
      // หน้าสรุปค่าบริการและรีวิว
      {
        path: 'summary',
        name: 'summary',
        component: () => import('../pages/JobSummaryPage.vue'),
      },

      {
        path: 'booking',
        name: 'booking',
        component: () => import('../components/booking/BookingConfirmationSheet.vue'),
      },

      {
        path: 'tech-register',
        name: 'tech-register',
        component: () => import('../pages/TechnicianRegisterPage.vue'),
      },

      {
        path: 'admin',
        name: 'admin-dashboard',
        component: () => import('../pages/admin/AdminDashboardPage.vue'),
      },

      {
        path: 'tech-job-board',
        name: 'tech-job-board',
        component: () => import('../pages/TechnicianJobBoardPage.vue'),
      },
      {
        path: 'tech-payment-history',
        name: 'tech-payment-history',
        component: () => import('../pages/TechnicianJobBoardPage.vue'),
      },
      {
        path: 'tech-reviews',
        name: 'tech-reviews',
        component: () => import('../pages/TechnicianReviewsPage.vue'),
      },
      {
        path: 'technicians/:technicianId/reviews',
        name: 'technician-reviews',
        component: () => import('../pages/TechnicianReviewsPage.vue'),
      },
      { path: 'my-bookings', component: () => import('../pages/CustomerBookingsPage.vue') },
    ],
  },
  // Catch all 404
  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound.vue'),
  },
]

export default routes
