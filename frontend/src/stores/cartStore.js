import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

const CART_KEY = 'siddu_cart';

export const useCartStore = defineStore('cart', () => {
  const items = ref(JSON.parse(localStorage.getItem(CART_KEY) || '[]'));
  const isOpen = ref(false);
  const justAdded = ref(null);

  watch(items, (val) => {
    localStorage.setItem(CART_KEY, JSON.stringify(val));
  }, { deep: true });

  const itemCount = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0));
  const total = computed(() => items.value.reduce((sum, i) => sum + i.price * i.quantity, 0));

  function addItem(product) {
    const existing = items.value.find(i => i.product_id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      items.value.push({
        product_id: product.id,
        product_name: product.name,
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

  return { items, isOpen, justAdded, itemCount, total, addItem, removeItem, updateQuantity, clearCart, toggleDrawer, openDrawer, closeDrawer };
});
