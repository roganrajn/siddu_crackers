import { createRouter, createWebHistory } from 'vue-router';
import { isSuperAdmin } from '@/constants/admin';

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/pages/HomePage.vue') },
      { path: 'cart', name: 'cart', component: () => import('@/pages/CartPage.vue') },
      { path: 'checkout', name: 'checkout', component: () => import('@/pages/CheckoutPage.vue') },
      { path: 'order-success', name: 'order-success', component: () => import('@/pages/OrderSuccessPage.vue') },
      { path: 'track-order', name: 'track-order', component: () => import('@/pages/TrackOrderPage.vue') },
      { path: 'category/:slug', name: 'category', component: () => import('@/pages/CategoryPage.vue') },
      { path: 'product/:slug', name: 'product', component: () => import('@/pages/ProductPage.vue') },
    ],
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/pages/admin/LoginPage.vue'),
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/pages/admin/DashboardPage.vue') },
      { path: 'categories', name: 'admin-categories', component: () => import('@/pages/admin/CategoriesPage.vue') },
      { path: 'banners', name: 'admin-banners', component: () => import('@/pages/admin/BannersPage.vue') },
      { path: 'products', name: 'admin-products', component: () => import('@/pages/admin/ProductsPage.vue') },
      { path: 'orders', name: 'admin-orders', component: () => import('@/pages/admin/OrdersPage.vue') },
      { path: 'orders/:id', name: 'admin-order-detail', component: () => import('@/pages/admin/OrderDetailPage.vue') },
      {
        path: 'images',
        name: 'admin-images',
        component: () => import('@/pages/admin/ImagesPage.vue'),
        meta: { requiresImagesAccess: true },
      },
      { path: 'settings', name: 'admin-settings', component: () => import('@/pages/admin/SettingsPage.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    return { top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('admin_token');
    if (!token) return next('/admin/login');
  }

  if (to.meta.requiresImagesAccess) {
    const user = JSON.parse(localStorage.getItem('admin_user') || 'null');
    if (!isSuperAdmin(user)) {
      return next('/admin/dashboard');
    }
  }

  next();
});

export default router;
