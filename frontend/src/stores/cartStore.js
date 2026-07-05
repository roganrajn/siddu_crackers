import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { calculateOrderBreakdown } from '@/utils/orderPricing';

const CART_KEY = 'siddu_cart';

export const useCartStore = defineStore('cart', () => {
  function normalizeCartItem(item) {
    const price = parseFloat(item.price);
    const mrpRaw = item.mrp_price ?? item.original_price;
    const normalized = { ...item, price };

    if (mrpRaw != null && !Number.isNaN(parseFloat(mrpRaw))) {
      const mrp = parseFloat(mrpRaw);
      normalized.mrp_price = mrp;
      normalized.original_price = parseFloat(item.original_price ?? mrp);
    }

    return normalized;
  }

  function applyProductToItem(item, product) {
    item.product_name = product.name;
    item.mrp_price = parseFloat(product.original_price);
    item.original_price = parseFloat(product.original_price);
    item.price = parseFloat(product.offer_price);
    if (product.image_url) item.image_url = product.image_url;
  }

  const items = ref(JSON.parse(localStorage.getItem(CART_KEY) || '[]').map(normalizeCartItem));
  const isOpen = ref(false);
  const justAdded = ref(null);

  watch(items, (val) => {
    localStorage.setItem(CART_KEY, JSON.stringify(val));
  }, { deep: true });

  const itemCount = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0));

  const pricing = computed(() => {
    const settingsStore = useSettingsStore();
    return calculateOrderBreakdown(items.value, settingsStore.settings);
  });

  const total = computed(() => pricing.value.net_amount);
  const subtotalMrp = computed(() => pricing.value.subtotal_mrp);

  const meetsMinOrder = computed(() => pricing.value.net_amount >= pricing.value.min_order_amount);

  const minOrderRemaining = computed(() =>
    Math.max(0, pricing.value.min_order_amount - pricing.value.net_amount)
  );

  function syncWithCatalog(products = []) {
    if (!products.length) return;

    const byId = new Map(products.map((p) => [p.id, p]));
    for (const item of items.value) {
      const product = byId.get(item.product_id);
      if (product) applyProductToItem(item, product);
    }
  }

  function addItem(product) {
    const existing = items.value.find(i => i.product_id === product.id);
    if (existing) {
      existing.quantity++;
      applyProductToItem(existing, product);
    } else {
      items.value.push({
        product_id: product.id,
        product_name: product.name,
        mrp_price: parseFloat(product.original_price),
        original_price: parseFloat(product.original_price),
        price: parseFloat(product.offer_price),
        image_url: product.image_url,
        quantity: 1,
      });
    }
    justAdded.value = product.id;
    setTimeout(() => { justAdded.value = null; }, 600);
  }

  function removeItem(productId) {
    items.value = items.value.filter(i => i.product_id !== productId);
  }

  function updateQuantity(productId, quantity) {
    const item = items.value.find(i => i.product_id === productId);
    if (item) {
      if (quantity <= 0) removeItem(productId);
      else item.quantity = quantity;
    }
  }

  function clearCart() {
    items.value = [];
  }

  function toggleDrawer() {
    isOpen.value = !isOpen.value;
  }

  function openDrawer() {
    isOpen.value = true;
  }

  function closeDrawer() {
    isOpen.value = false;
  }

  return {
    items,
    isOpen,
    justAdded,
    itemCount,
    total,
    subtotalMrp,
    pricing,
    meetsMinOrder,
    minOrderRemaining,
    addItem,
    syncWithCatalog,
    removeItem,
    updateQuantity,
    clearCart,
    toggleDrawer,
    openDrawer,
    closeDrawer,
  };
});
