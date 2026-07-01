<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>Hero Banners</h2>
      <button class="btn btn--sm" @click="openModal()">+ Add Banner</button>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Preview</th>
          <th>Title</th>
          <th>Subtitle</th>
          <th>Button</th>
          <th>Order</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="banner in banners" :key="banner.id">
          <td>
            <div class="banner-thumb" :style="banner.image_url ? { backgroundImage: `url(${banner.image_url})` } : {}">
              <span v-if="!banner.image_url">🎆</span>
            </div>
          </td>
          <td>{{ banner.title }}</td>
          <td>{{ banner.subtitle }}</td>
          <td>{{ banner.button_text }}</td>
          <td>{{ banner.sort_order }}</td>
          <td>
            <span :class="['status-badge', banner.is_active ? 'confirmed' : 'cancelled']">
              {{ banner.is_active ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td class="actions">
            <button @click="openModal(banner)">Edit</button>
            <button class="danger" @click="handleDelete(banner)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ editing ? 'Edit' : 'Add' }} Banner</h3>
        <form @submit.prevent="handleSave">
          <div class="form-group">
            <label>Title *</label>
            <input v-model="form.title" required />
          </div>
          <div class="form-group">
            <label>Subtitle</label>
            <input v-model="form.subtitle" />
          </div>
          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div class="form-group">
              <label>Button Text</label>
              <input v-model="form.button_text" />
            </div>
            <div class="form-group">
              <label>Button Link</label>
              <input v-model="form.button_link" placeholder="#products" />
            </div>
          </div>
          <div class="form-group">
            <label>Sort Order</label>
            <input v-model.number="form.sort_order" type="number" />
          </div>
          <div class="form-group">
            <label>Banner Image</label>
            <div class="image-upload-row">
              <div v-if="imagePreview" class="banner-preview">
                <img :src="imagePreview" alt="Banner preview" />
              </div>
              <div class="image-upload-field">
                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp" @change="onFileChange" />
                <p class="field-hint">JPEG, PNG, GIF, or WebP · max 10MB</p>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label><input v-model="form.is_active" type="checkbox" /> Active</label>
          </div>
          <p v-if="error" class="error-msg">{{ error }}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn--outline btn--sm" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn--sm" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useBannerStore } from '@/stores/bannerStore';

const bannerStore = useBannerStore();
const banners = computed(() => bannerStore.banners);
const showModal = ref(false);
const editing = ref(null);
const imageFile = ref(null);
const imagePreview = ref(null);
const saving = ref(false);
const error = ref('');
const form = ref({ title: '', subtitle: '', button_text: 'Shop Now', button_link: '#products', sort_order: 0, is_active: true });

onMounted(() => bannerStore.fetchBanners(true));

function openModal(banner = null) {
  editing.value = banner;
  error.value = '';
  form.value = banner
    ? { title: banner.title, subtitle: banner.subtitle || '', button_text: banner.button_text, button_link: banner.button_link, sort_order: banner.sort_order, is_active: banner.is_active }
    : { title: '', subtitle: '', button_text: 'Shop Now', button_link: '#products', sort_order: 0, is_active: true };
  imageFile.value = null;
  imagePreview.value = banner?.image_url || null;
  showModal.value = true;
}

function onFileChange(e) {
  const file = e.target.files[0];
  imageFile.value = file || null;
  if (file) {
    imagePreview.value = URL.createObjectURL(file);
  }
}

async function handleSave() {
  saving.value = true;
  error.value = '';
  try {
    const fd = new FormData();
    Object.entries(form.value).forEach(([k, v]) => fd.append(k, v));
    if (imageFile.value) fd.append('image', imageFile.value);
    if (editing.value) await bannerStore.updateBanner(editing.value.id, fd);
    else await bannerStore.createBanner(fd);
    showModal.value = false;
    await bannerStore.fetchBanners(true);
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Failed to save banner';
  } finally {
    saving.value = false;
  }
}

async function handleDelete(banner) {
  if (!confirm(`Delete banner "${banner.title}"?`)) return;
  await bannerStore.deleteBanner(banner.id);
}
</script>

<style lang="scss" scoped>
@import '@/pages/admin/admin-shared.scss';

.banner-thumb {
  width: 80px;
  height: 45px;
  border-radius: $radius-sm;
  background: linear-gradient(135deg, $primary, $secondary);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.banner-preview {
  width: 120px;
  height: 68px;
  flex-shrink: 0;
  border-radius: $radius-sm;
  overflow: hidden;
  border: 2px solid $border;
  background: $background;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.image-upload-field {
  flex: 1;
}

.field-hint {
  font-size: 0.8rem;
  color: $text-muted;
  margin-top: 6px;
}

.error-msg {
  color: #ef4444;
  font-size: 0.9rem;
  margin-bottom: 12px;
}
</style>
