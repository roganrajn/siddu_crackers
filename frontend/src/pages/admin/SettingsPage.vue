<template>
  <div class="admin-page">
    <div class="page-header"><h2>Website Settings</h2></div>

    <div class="account-card">
      <h3 class="section-label">Admin Account</h3>
      <p class="account-email">Logged in as <strong>{{ authStore.user?.email }}</strong></p>
      <form class="password-form" @submit.prevent="handleChangePassword">
        <div class="settings-grid">
          <div class="form-group">
            <label>Current Password</label>
            <input v-model="passwordForm.current_password" type="password" required autocomplete="current-password" />
          </div>
          <div class="form-group">
            <label>New Password</label>
            <input v-model="passwordForm.new_password" type="password" required minlength="6" autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label>Confirm New Password</label>
            <input v-model="passwordForm.confirm_password" type="password" required minlength="6" autocomplete="new-password" />
          </div>
        </div>
        <button type="submit" class="btn btn--sm" :disabled="changingPassword">
          {{ changingPassword ? 'Updating...' : 'Change Password' }}
        </button>
        <p v-if="passwordError" class="error-msg">{{ passwordError }}</p>
        <p v-if="passwordSuccess" class="success-msg">{{ passwordSuccess }}</p>
      </form>
    </div>

    <form class="settings-form" @submit.prevent="handleSave">
      <h3 class="section-label">Branding</h3>
      <div class="settings-grid">
        <div class="form-group"><label>Company Name</label><input v-model="form.company_name" /></div>
        <template v-if="authStore.canManageTheme">
          <div class="form-group"><label>Primary Color</label><input v-model="form.primary_color" type="color" /></div>
          <div class="form-group"><label>Secondary Color</label><input v-model="form.secondary_color" type="color" /></div>
          <div class="form-group"><label>Accent Color</label><input v-model="form.accent_color" type="color" /></div>
        </template>
        <div class="form-group"><label>Logo</label><input type="file" accept="image/*" @change="onLogoChange" /><img v-if="form.logo" :src="form.logo" class="logo-preview" loading="lazy" /></div>
        <div class="form-group"><label>Copyright Text</label><input v-model="form.copyright_text" /></div>
      </div>

      <h3 class="section-label">Contact</h3>
      <div class="settings-grid">
        <div class="form-group"><label>Phone</label><input v-model="form.phone" /></div>
        <div class="form-group"><label>WhatsApp</label><input v-model="form.whatsapp" /></div>
        <div class="form-group"><label>Email</label><input v-model="form.email" type="email" /></div>
        <div class="form-group"><label>Address</label><input v-model="form.address" /></div>
        <div class="form-group"><label>Offer Banner</label><input v-model="form.offer_banner" /></div>
        <div class="form-group"><label>Confirmation Time</label><input v-model="form.confirmation_time" placeholder="Within 2 hours" /></div>
        <div class="form-group"><label>Footer Text</label><input v-model="form.footer_text" /></div>
      </div>

      <h3 class="section-label">Order Rules</h3>
      <div class="settings-grid">
        <div class="form-group">
          <label>Minimum Order Amount (₹)</label>
          <input v-model.number="form.min_order_amount" type="number" min="0" step="1" />
        </div>
        <div class="form-group">
          <label>Packing Charge (%)</label>
          <input v-model.number="form.order_packing_percentage" type="number" min="0" max="100" step="0.01" />
        </div>
      </div>
      <p class="settings-note">
        Product discounts come from each product's MRP and offer price. Summary shows overall savings (e.g. Upto 80% discount).
      </p>

      <h3 class="section-label">GST Configuration</h3>
      <div class="settings-grid">
        <div class="form-group">
          <label>
            <input v-model.boolean="form.gst_enabled" type="checkbox" />
            Enable GST
          </label>
        </div>
        <div class="form-group">
          <label>GST Rate (%)</label>
          <input 
            v-model.number="form.gst_percentage" 
            type="number" 
            min="0" 
            max="100" 
            step="0.01"
            :disabled="!form.gst_enabled"
          />
        </div>
        <div class="form-group full-width">
          <label>GST Number (GSTIN)</label>
          <input 
            v-model="form.gst_number"
            placeholder="e.g., 33ABAFD1628C1Z6"
            :disabled="!form.gst_enabled"
          />
        </div>
      </div>
      <p class="settings-note">
        When enabled, GST applies at checkout for all states except Tamil Nadu and Puducherry/Pondicherry. Cart stays without GST until a state is selected. If disabled, GST is never applied. You can still switch With/Without GST on an individual order when GST is enabled.
      </p>

      <h3 class="section-label">SEO & Analytics</h3>
      <div class="settings-grid">
        <div class="form-group"><label>Meta Title</label><input v-model="form.meta_title" /></div>
        <div class="form-group"><label>Meta Description</label><input v-model="form.meta_description" /></div>
        <div class="form-group"><label>Google Analytics ID</label><input v-model="form.google_analytics_id" placeholder="G-XXXXXXXX" /></div>
        <div class="form-group"><label>Facebook Pixel ID</label><input v-model="form.facebook_pixel_id" /></div>
        <div class="form-group full-width"><label>Google Map Embed URL</label><input v-model="form.google_map_embed" /></div>
      </div>

      <h3 class="section-label">Social Links</h3>
      <div class="settings-grid">
        <div class="form-group"><label>Facebook</label><input v-model="form.facebook" /></div>
        <div class="form-group"><label>Instagram</label><input v-model="form.instagram" /></div>
        <div class="form-group"><label>YouTube</label><input v-model="form.youtube" /></div>
      </div>

      <button type="submit" class="btn" :disabled="saving">{{ saving ? 'Saving...' : 'Save Settings' }}</button>
      <p v-if="saved" class="success-msg">✅ Settings saved!</p>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';

const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const form = ref({});
const logoFile = ref(null);
const saving = ref(false);
const saved = ref(false);
const changingPassword = ref(false);
const passwordError = ref('');
const passwordSuccess = ref('');
const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: '',
});

onMounted(async () => {
  await Promise.all([
    settingsStore.fetchSettings(),
    authStore.fetchMe().catch(() => {}),
  ]);
  form.value = { ...settingsStore.settings };
});

function onLogoChange(e) { logoFile.value = e.target.files[0]; }

async function handleChangePassword() {
  passwordError.value = '';
  passwordSuccess.value = '';

  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    passwordError.value = 'New passwords do not match';
    return;
  }

  changingPassword.value = true;
  try {
    await authStore.changePassword(
      passwordForm.value.current_password,
      passwordForm.value.new_password
    );
    passwordForm.value = { current_password: '', new_password: '', confirm_password: '' };
    passwordSuccess.value = 'Password updated successfully.';
    setTimeout(() => { passwordSuccess.value = ''; }, 4000);
  } catch (e) {
    passwordError.value = e.response?.data?.error || 'Failed to change password';
  } finally {
    changingPassword.value = false;
  }
}

async function handleSave() {
  saving.value = true;
  saved.value = false;
  const fd = new FormData();
  Object.entries(form.value).forEach(([k, v]) => {
    if (v != null) {
      // For boolean fields, convert to lowercase string
      if (typeof v === 'boolean') {
        fd.append(k, v ? 'true' : 'false');
      } else {
        fd.append(k, v);
      }
    }
  });
  if (logoFile.value) fd.append('logo', logoFile.value);
  await settingsStore.updateSettings(fd);
  form.value = { ...settingsStore.settings };
  saving.value = false;
  saved.value = true;
  setTimeout(() => { saved.value = false; }, 3000);
}
</script>

<style lang="scss" scoped>
@import '@/pages/admin/admin-shared.scss';

.settings-form { @include card; padding: 32px; margin-top: 24px; }
.account-card { @include card; padding: 32px; }
.account-email { font-size: 0.9rem; color: $text-muted; margin-bottom: 20px; }
.password-form { margin-top: 8px; }
.section-label { font-size: 1rem; color: $primary; margin: 24px 0 16px; padding-bottom: 8px; border-bottom: 2px solid $secondary; &:first-child { margin-top: 0; } }
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.full-width { grid-column: 1 / -1; }
.logo-preview { max-width: 100px; margin-top: 8px; border-radius: $radius-sm; }
.success-msg { color: #059669; margin-top: 12px; font-weight: 600; }
.error-msg { color: #dc2626; margin-top: 12px; font-size: 0.9rem; }
.settings-note {
  margin: -4px 0 16px;
  font-size: 0.85rem;
  color: $text-muted;
  line-height: 1.45;
}
@media (max-width: 768px) { .settings-grid { grid-template-columns: 1fr; } }
</style>
