<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>Categories</h2>
      <button class="btn btn--sm" @click="openModal()">+ Add Category</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Name</th>
          <th>Slug</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cat in categories" :key="cat.id">
          <td>{{ cat.sort_order }}</td>
          <td>{{ cat.name }}</td>
          <td>{{ cat.slug }}</td>
          <td>
            <span :class="['status-badge', cat.is_visible ? 'confirmed' : 'cancelled']">
              {{ cat.is_visible ? 'Visible' : 'Hidden' }}
            </span>
          </td>
          <td class="actions">
            <button @click="openModal(cat)">Edit</button>
            <button @click="toggleVisibility(cat)">{{ cat.is_visible ? 'Hide' : 'Show' }}</button>
            <button class="danger" @click="handleDelete(cat)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ editing ? 'Edit' : 'Add' }} Category</h3>
        <form @submit.prevent="handleSave">
          <div class="form-group">
            <label>Name</label>
            <input v-model="form.name" required />
          </div>
          <div class="form-group">
            <label>Sort Order</label>
            <input v-model.number="form.sort_order" type="number" />
          </div>
          <div class="form-group">
            <label>Icon (emoji)</label>
            <input v-model="form.icon" placeholder="🎇" />
          </div>
          <div class="form-group">
            <label>Color</label>
            <input v-model="form.color" type="color" />
          </div>
          <div class="form-group">
            <label>Banner Image</label>
            <input type="file" accept="image/*" @change="onFileChange" />
          </div>
          <div class="form-group">
            <label>
              <input v-model="form.is_visible" type="checkbox" /> Visible
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn--outline btn--sm" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn--sm">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCategoryStore } from '@/stores/categoryStore';

const categoryStore = useCategoryStore();
const categories = computed(() => categoryStore.categories);

const showModal = ref(false);
const editing = ref(null);
const form = ref({ name: '', sort_order: 0, is_visible: true, icon: '🎇', color: '#ff6b00' });
const bannerFile = ref(null);

onMounted(() => categoryStore.fetchCategories(true));

function openModal(cat = null) {
  editing.value = cat;
  form.value = cat ? { name: cat.name, sort_order: cat.sort_order, is_visible: cat.is_visible, icon: cat.icon || '🎇', color: cat.color || '#ff6b00' } : { name: '', sort_order: 0, is_visible: true, icon: '🎇', color: '#ff6b00' };
  bannerFile.value = null;
  showModal.value = true;
}

function onFileChange(e) {
  bannerFile.value = e.target.files[0];
}

async function handleSave() {
  const fd = new FormData();
  fd.append('name', form.value.name);
  fd.append('sort_order', form.value.sort_order);
  fd.append('is_visible', form.value.is_visible);
  fd.append('icon', form.value.icon);
  fd.append('color', form.value.color);
  if (bannerFile.value) fd.append('banner_image', bannerFile.value);

  if (editing.value) {
    await categoryStore.updateCategory(editing.value.id, fd);
  } else {
    await categoryStore.createCategory(fd);
  }
  showModal.value = false;
}

async function toggleVisibility(cat) {
  const fd = new FormData();
  fd.append('is_visible', !cat.is_visible);
  await categoryStore.updateCategory(cat.id, fd);
}

async function handleDelete(cat) {
  if (!confirm(`Delete "${cat.name}"?`)) return;
  const result = await categoryStore.deleteCategory(cat.id);
  if (result.hidden) alert('Category hidden because it has products.');
}
</script>

<style lang="scss" scoped>
@import '@/pages/admin/admin-shared.scss';
</style>
