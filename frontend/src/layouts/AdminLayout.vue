<template>
  <div class="admin-layout">
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar__header">
        <span class="sidebar__logo">🎆 Siddu Admin</span>
      </div>
      <nav class="sidebar__nav">
        <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="sidebar__link" @click="sidebarOpen = false">
          <span class="sidebar__icon">{{ item.icon }}</span>
          {{ item.label }}
        </router-link>
      </nav>
      <button class="sidebar__logout" @click="handleLogout">🚪 Logout</button>
    </aside>
    <div class="admin-main">
      <header class="admin-header">
        <button class="menu-toggle" @click="sidebarOpen = !sidebarOpen">☰</button>
        <h1>{{ pageTitle }}</h1>
      </header>
      <div class="admin-content">
        <router-view />
      </div>
    </div>
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const sidebarOpen = ref(false);

const allNavItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/banners', label: 'Banners', icon: '🖼️' },
  { path: '/admin/categories', label: 'Categories', icon: '📁' },
  { path: '/admin/products', label: 'Products', icon: '🎇' },
  { path: '/admin/orders', label: 'Orders', icon: '📦' },
  { path: '/admin/images', label: 'Images', icon: '📷', requiresImagesAccess: true },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

const navItems = computed(() =>
  allNavItems.filter((item) => !item.requiresImagesAccess || authStore.canManageImages)
);

const pageTitle = computed(() => {
  const item = navItems.value.find(n => route.path.startsWith(n.path));
  return item?.label || 'Admin';
});

function handleLogout() {
  authStore.logout();
  router.push('/admin/login');
}
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  overflow-x: hidden;
}

.sidebar {
  width: 260px;
  background: $text-dark;
  color: $white;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: transform 0.3s ease;

  &__header {
    padding: 24px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }

  &__logo {
    font-size: 1.2rem;
    font-weight: 700;
  }

  &__nav {
    flex: 1;
    padding: 16px 0;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    color: rgba(255,255,255,0.7);
    transition: $transition;

    &:hover, &.router-link-active {
      background: rgba(255,107,0,0.2);
      color: $white;
    }
  }

  &__icon {
    font-size: 1.2rem;
  }

  &__logout {
    margin: 16px;
    padding: 12px;
    background: rgba(255,255,255,0.1);
    border: none;
    color: $white;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: $transition;

    &:hover {
      background: rgba(255,0,0,0.3);
    }
  }
}

.admin-main {
  flex: 1;
  margin-left: 260px;
  background: #f5f5f5;
  min-width: 0;
  width: 100%;
}

.admin-header {
  background: $white;
  padding: 16px 24px;
  box-shadow: $shadow;
  display: flex;
  align-items: center;
  gap: 16px;

  h1 {
    font-size: 1.4rem;
  }
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.admin-content {
  padding: 24px;
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    width: min(280px, 86vw);
    transform: translateX(-100%);
    box-shadow: none;

    &.open {
      transform: translateX(0);
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
    }

    &:not(.open) {
      visibility: hidden;
      pointer-events: none;
    }
  }

  .admin-main {
    margin-left: 0;
    width: 100%;
  }

  .admin-header {
    padding: 14px 16px;
    position: sticky;
    top: 0;
    z-index: 50;

    h1 {
      font-size: 1.15rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .menu-toggle {
    display: block;
    flex-shrink: 0;
    padding: 4px;
  }

  .admin-content {
    padding: 16px;
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 99;
  }
}
</style>

<style lang="scss">
@media print {
  .sidebar,
  .admin-header,
  .sidebar-overlay,
  .menu-toggle {
    display: none !important;
  }

  .admin-layout {
    display: block;
    min-height: auto;
  }

  .admin-main {
    margin-left: 0 !important;
    background: #fff !important;
  }

  .admin-content {
    padding: 0 !important;
  }

  body {
    background: #fff !important;
  }
}
</style>
