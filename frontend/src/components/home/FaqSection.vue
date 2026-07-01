<template>
  <section class="faq-section">
    <div class="container">
      <h2 class="section-title">FAQ</h2>
      <div class="faq-list">
        <details v-for="(item, i) in FAQ_ITEMS" :key="i" class="faq-item">
          <summary>{{ item.q }}</summary>
          <p>{{ item.a }}</p>
        </details>
      </div>
    </div>
  </section>
</template>

<script setup>
import { FAQ_ITEMS } from '@/constants';
</script>

<style lang="scss" scoped>
.faq-section { padding: 48px 0 60px; }

.faq-list { max-width: 800px; }

.faq-item {
  @include card;
  margin-bottom: 12px;
  overflow: hidden;

  summary {
    padding: 16px 20px;
    font-weight: 600;
    cursor: pointer;
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &::after { content: '+'; font-size: 1.2rem; color: $primary; }
  }

  &[open] summary::after { content: '−'; }

  p {
    padding: 0 20px 16px;
    color: $text-muted;
    line-height: 1.7;
    font-size: 0.95rem;
  }
}
</style>
