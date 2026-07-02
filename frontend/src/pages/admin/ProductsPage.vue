<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>Products</h2>
      <button class="btn btn--sm" @click="openModal()">+ Add Product</button>
    </div>

    <div class="filters">
      <input v-model="search" placeholder="Search products..." @input="debouncedSearch" />
      <select v-model="categoryFilter" @change="onFilterChange">
        <option value="">All Categories</option>
        <option v-for="cat in allCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
    </div>

    <div v-if="loading" class="loading-state">Loading products...</div>

    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>Image</th>
          <th>Name</th>
          <th>SKU</th>
          <th>Original</th>
          <th>Offer</th>
          <th>Discount</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>
            <div class="product-thumb">
              <img v-if="product.image_url" :src="product.image_url" :alt="product.name" loading="lazy" />
              <span v-else>🎆</span>
            </div>
          </td>
          <td>
            {{ product.name }}
            <span v-if="product.is_best_seller" class="badge badge--best-seller" style="margin-left:4px">BS</span>
          </td>
          <td>{{ product.sku }}</td>
          <td>{{ formatPrice(product.original_price) }}</td>
          <td>{{ formatPrice(product.offer_price) }}</td>
          <td>{{ product.discount_percentage }}%</td>
          <td>
            <span :class="['status-badge', product.is_visible ? 'confirmed' : 'cancelled']">
              {{ product.is_visible ? 'Visible' : 'Hidden' }}
            </span>
          </td>
          <td class="actions">
            <button @click="openModal(product)">Edit</button>
            <button @click="handleDuplicate(product)">Copy</button>
            <button @click="toggleVisibility(product)">{{ product.is_visible ? 'Hide' : 'Show' }}</button>
            <button class="danger" @click="handleDelete(product)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!products.length && !loading" class="empty-state">No products found.</div>

    <div v-if="totalCount > 0" class="pagination">
      <button :disabled="page <= 1" @click="goToPage(page - 1)">Prev</button>
      <span>Page {{ page }} of {{ totalPages }} · {{ totalCount }} product(s)</span>
      <button :disabled="page >= totalPages" @click="goToPage(page + 1)">Next</button>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal modal--wide product-form-modal">
        <h3>{{ editing ? 'Edit' : 'Add' }} Product</h3>
        <form class="product-form" @submit.prevent="handleSave">
          <section class="form-section">
            <h4 class="form-section__title">Basic Details</h4>
            <div class="form-grid form-grid--2">
              <div class="form-group">
                <label>Product Name *</label>
                <input v-model="form.name" required placeholder="e.g. 4 Inch Lakshmi" />
              </div>
              <div class="form-group">
                <label>SKU</label>
                <input v-model="form.sku" placeholder="e.g. LK-001" />
              </div>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="form.description" rows="3" placeholder="Product description..."></textarea>
            </div>
          </section>

          <section class="form-section">
            <h4 class="form-section__title">Pricing & Order</h4>
            <div class="form-grid form-grid--3">
              <div class="form-group">
                <label>Original Price *</label>
                <input v-model.number="form.original_price" type="number" step="0.01" min="0" required />
              </div>
              <div class="form-group">
                <label>Offer Price *</label>
                <input v-model.number="form.offer_price" type="number" step="0.01" min="0" required />
              </div>
              <div class="form-group">
                <label>Sort Order</label>
                <input v-model.number="form.sort_order" type="number" min="0" />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h4 class="form-section__title">Categories</h4>
            <div class="category-grid">
              <label v-for="cat in allCategories" :key="cat.id" class="category-check">
                <input type="checkbox" :value="cat.id" v-model="form.category_ids" />
                <span>{{ cat.icon }} {{ cat.name }}</span>
              </label>
            </div>
          </section>

          <section class="form-section">
            <h4 class="form-section__title">Product Image</h4>
            <div class="image-upload-row">
              <div v-if="imagePreview" class="image-preview">
                <img :src="imagePreview" alt="Preview" />
              </div>
              <div class="form-group image-upload-field">
                <input type="file" accept="image/*" @change="onFileChange" />
                <p class="field-hint">JPEG, PNG, or WebP up to 10 MB.</p>
              </div>
            </div>
          </section>

          <section class="form-section form-section--flags">
            <label class="flag-check"><input v-model="form.is_visible" type="checkbox" /> Visible</label>
            <label class="flag-check"><input v-model="form.is_best_seller" type="checkbox" /> Best Seller</label>
            <label class="flag-check"><input v-model="form.is_featured" type="checkbox" /> Featured</label>
          </section>

          <div class="modal-actions">
            <button type="button" class="btn btn--outline btn--sm" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn--sm" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
          </div>
          <p v-if="saveError" class="save-error">{{ saveError }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { formatPrice, debounce } from '@/utils/helpers';

const productStore = useProductStore();
const categoryStore = useCategoryStore();

const products = computed(() => productStore.products);
const allCategories = computed(() => categoryStore.categories);
const search = ref('');
const categoryFilter = ref('');
const page = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);
const loading = ref(false);
const saving = ref(false);
const saveError = ref('');
const showModal = ref(false);
const editing = ref(null);
const imageFile = ref(null);
const imagePreview = ref(null);

const form = ref({
  name: '', sku: '', description: '', original_price: 0, offer_price: 0,
  sort_order: 0, category_ids: [], is_visible: true, is_best_seller: false, is_featured: false,
});

const debouncedSearch = debounce(() => {
  page.value = 1;
  loadProducts();
}, 300);

onMounted(async () => {
  await categoryStore.fetchCategories(true);
  await loadProducts();
});

async function loadProducts() {
  loading.value = true;
  try {
    const data = await productStore.fetchProducts({
      admin: 'true',
      page: page.value,
      limit: 10,
      search: search.value || undefined,
      category_id: categoryFilter.value || undefined,
    });
    totalPages.value = data.totalPages || 1;
    totalCount.value = data.total ?? products.value.length;
  } finally {
    loading.value = false;
  }
}

function onFilterChange() {
  page.value = 1;
  loadProducts();
}

function goToPage(p) {
  page.value = p;
  loadProducts();
}

function openModal(product = null) {
  editing.value = product;
  if (product) {
    form.value = {
      name: product.name, sku: product.sku, description: product.description || '',
      original_price: parseFloat(product.original_price), offer_price: parseFloat(product.offer_price),
      sort_order: product.sort_order, category_ids: product.categories?.map(c => c.id) || [],
      is_visible: product.is_visible, is_best_seller: product.is_best_seller, is_featured: product.is_featured,
    };
    imagePreview.value = product.image_url || null;
  } else {
    form.value = {
      name: '', sku: '', description: '', original_price: 0, offer_price: 0,
      sort_order: 0, category_ids: [], is_visible: true, is_best_seller: false, is_featured: false,
    };
    imagePreview.value = null;
  }
  imageFile.value = null;
  saveError.value = '';
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
  saveError.value = '';
  try {
    const fd = new FormData();
    Object.entries(form.value).forEach(([key, val]) => {
      if (key === 'category_ids') {
        fd.append(key, JSON.stringify(val));
      } else if (key === 'sku' && !String(val || '').trim()) {
        // Skip empty SKU — empty string violates UNIQUE constraint
      } else if (typeof val === 'boolean') {
        fd.append(key, val ? 'true' : 'false');
      } else {
        fd.append(key, val);
      }
    });
    if (imageFile.value) fd.append('image', imageFile.value);

    if (editing.value) await productStore.updateProduct(editing.value.id, fd);
    else await productStore.createProduct(fd);
    showModal.value = false;
    await loadProducts();
  } catch (e) {
    saveError.value = e.response?.data?.error || 'Failed to save product. Please try again.';
  } finally {
    saving.value = false;
  }
}

async function toggleVisibility(product) {
  const fd = new FormData();
  fd.append('is_visible', !product.is_visible);
  await productStore.updateProduct(product.id, fd);
  await loadProducts();
}

async function handleDuplicate(product) {
  await productStore.duplicateProduct(product.id);
  await loadProducts();
  alert('Product duplicated!');
}

async function handleDelete(product) {
  if (!confirm(`Delete "${product.name}"?`)) return;
  await productStore.deleteProduct(product.id);
  if (products.value.length === 1 && page.value > 1) page.value--;
  await loadProducts();
}
</script>

<style lang="scss" scoped>
@import '@/pages/admin/admin-shared.scss';

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  input, select {
    padding: 10px 16px;
    border: 2px solid $border;
    border-radius: $radius-sm;
    font-size: 0.9rem;
  }

  input { flex: 1; max-width: 400px; }
  select { min-width: 200px; }
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px;
  color: $text-muted;
}

.product-thumb {
  width: 40px;
  height: 40px;
  border-radius: $radius-sm;
  overflow: hidden;
  background: $background;
  display: flex;
  align-items: center;
  justify-content: center;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.modal--wide { max-width: 720px; }

.product-form-modal {
  h3 { margin-bottom: 8px; }
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid $border;

  &:last-of-type { border-bottom: none; }

  &__title {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $text-muted;
    margin-bottom: 14px;
  }

  &--flags {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    border-bottom: none;
    padding-bottom: 0;
  }
}

.form-grid {
  display: grid;
  gap: 16px;

  &--2 { grid-template-columns: 1fr 1fr; }
  &--3 { grid-template-columns: repeat(3, 1fr); }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  padding: 14px;
  background: $background;
  border-radius: $radius-sm;
  border: 1px solid $border;
}

.category-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  cursor: pointer;

  input { width: auto; flex-shrink: 0; }
}

.flag-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;

  input { width: auto; }
}

.image-upload-row {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.image-preview {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  border-radius: $radius-sm;
  overflow: hidden;
  border: 2px solid $border;
  background: $background;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.image-upload-field {
  flex: 1;
  margin-bottom: 0;
}

.field-hint {
  font-size: 0.8rem;
  color: $text-muted;
  margin-top: 6px;
}

.save-error {
  color: #ef4444;
  font-size: 0.9rem;
  margin-top: 12px;
  text-align: center;
}

@media (max-width: 640px) {
  .form-grid--2,
  .form-grid--3 { grid-template-columns: 1fr; }

  .filters {
    flex-direction: column;
    input { max-width: none; }
    select { width: 100%; }
  }
}
</style>
