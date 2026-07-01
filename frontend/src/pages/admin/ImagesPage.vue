<template>
  <div class="admin-page">
    <div class="page-header">
      <div>
        <h2>S3 Images</h2>
        <p v-if="meta.bucket" class="meta">
          Bucket: <strong>{{ meta.bucket }}</strong> · Folder: <strong>{{ meta.rootFolder }}/</strong>
          · {{ meta.count }} file(s)
        </p>
      </div>
      <button class="btn btn--sm btn--secondary" :disabled="loading" @click="loadImages">
        {{ loading ? 'Loading...' : '↻ Refresh' }}
      </button>
    </div>

    <div class="filters">
      <button
        class="filter-btn"
        :class="{ active: !folderFilter }"
        @click="folderFilter = ''; loadImages()"
      >
        All
      </button>
      <button
        v-for="f in folders"
        :key="f"
        class="filter-btn"
        :class="{ active: folderFilter === f }"
        @click="folderFilter = f; loadImages()"
      >
        {{ f }}
      </button>
    </div>

    <p v-if="success" class="success-msg">{{ success }}</p>
    <p v-if="error" class="error-msg">{{ error }}</p>

    <div v-if="loading" class="loading">Loading images from S3...</div>

    <div v-else-if="!images.length" class="empty">
      <span>📭</span>
      <p>No images in this folder yet.</p>
      <p class="hint">Upload via Products, Categories, Banners, or Settings — files go to S3 automatically.</p>
    </div>

    <div v-else class="images-grid">
      <div v-for="img in images" :key="img.key" class="image-card">
        <a :href="img.url" target="_blank" rel="noopener" class="image-card__preview">
          <img :src="img.url" :alt="img.filename" loading="lazy" @error="onImgError" />
        </a>
        <div class="image-card__body">
          <span class="image-card__folder">{{ img.folder }}</span>
          <p class="image-card__name" :title="img.filename">{{ img.filename }}</p>
          <p class="image-card__meta">{{ formatSize(img.size) }} · {{ formatDate(img.lastModified) }}</p>
          <div class="image-card__actions">
            <button class="btn btn--sm" @click="copyUrl(img.url)">Copy URL</button>
            <a :href="img.url" target="_blank" rel="noopener" class="btn btn--sm btn--outline">Open</a>
            <button
              class="btn btn--sm btn--danger"
              :disabled="deletingKey === img.key"
              @click="handleDelete(img)"
            >
              {{ deletingKey === img.key ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const images = ref([]);
const folders = ref([]);
const folderFilter = ref('');
const loading = ref(false);
const deletingKey = ref('');
const error = ref('');
const success = ref('');
const meta = ref({ bucket: '', rootFolder: '', count: 0 });
const copied = ref('');

async function loadImages() {
  loading.value = true;
  error.value = '';
  success.value = '';
  try {
    const { data } = await api.get('/images', {
      params: folderFilter.value ? { folder: folderFilter.value } : {},
    });
    images.value = data.items || [];
    folders.value = data.folders || [];
    meta.value = {
      bucket: data.bucket,
      rootFolder: data.rootFolder,
      count: data.count,
    };
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Failed to load images';
    images.value = [];
  } finally {
    loading.value = false;
  }
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

async function copyUrl(url) {
  try {
    await navigator.clipboard.writeText(url);
    copied.value = url;
    setTimeout(() => { copied.value = ''; }, 2000);
  } catch {
    window.prompt('Copy URL:', url);
  }
}

function onImgError(e) {
  e.target.style.opacity = '0.3';
}

async function handleDelete(img) {
  const confirmed = confirm(
    `Delete "${img.filename}" from S3?\n\nThis cannot be undone. If a product or banner still uses this URL, it will show a broken image until you upload a new one.`
  );
  if (!confirmed) return;

  deletingKey.value = img.key;
  error.value = '';
  success.value = '';
  try {
    await api.delete('/images', { data: { key: img.key } });
    images.value = images.value.filter((i) => i.key !== img.key);
    meta.value.count = images.value.length;
    success.value = `"${img.filename}" deleted from S3.`;
    setTimeout(() => { success.value = ''; }, 4000);
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Failed to delete image';
  } finally {
    deletingKey.value = '';
  }
}

onMounted(loadImages);
</script>

<style lang="scss" scoped>
@import '@/pages/admin/admin-shared.scss';

.meta {
  font-size: 0.85rem;
  color: $text-muted;
  margin-top: 4px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.filter-btn {
  padding: 8px 14px;
  border: 2px solid $border;
  border-radius: 20px;
  background: $white;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: $transition;

  &.active, &:hover {
    border-color: $primary;
    background: $primary;
    color: $white;
  }
}

.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: $radius-sm;
  margin-bottom: 16px;
}

.success-msg {
  background: #ecfdf5;
  color: #059669;
  padding: 12px 16px;
  border-radius: $radius-sm;
  margin-bottom: 16px;
}

.loading, .empty {
  text-align: center;
  padding: 48px 20px;
  color: $text-muted;

  span { font-size: 2.5rem; display: block; margin-bottom: 12px; }
  .hint { font-size: 0.85rem; margin-top: 8px; }
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.image-card {
  @include card;
  overflow: hidden;

  &__preview {
    display: block;
    aspect-ratio: 4/3;
    background: $background;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    &:hover img { transform: scale(1.05); }
  }

  &__body { padding: 12px 14px; }

  &__folder {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $primary;
    background: rgba(125, 60, 94, 0.08);
    padding: 2px 8px;
    border-radius: 10px;
    margin-bottom: 6px;
  }

  &__name {
    font-size: 0.82rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
  }

  &__meta {
    font-size: 0.75rem;
    color: $text-muted;
    margin-bottom: 10px;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .btn { flex: 1 1 calc(50% - 4px); min-height: 32px; padding: 6px 10px; font-size: 0.75rem; }

    .btn--danger {
      flex: 1 1 100%;
      border-color: #ef4444;
      color: #ef4444;
      background: $white;

      &:hover:not(:disabled) {
        background: #ef4444;
        color: $white;
        border-color: #ef4444;
      }

      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  }
}
</style>
