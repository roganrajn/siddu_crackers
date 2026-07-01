<template>
  <section class="why-us">
    <div class="container">
      <h2 class="section-title">Why Choose Siddu Crackers</h2>
      <div class="why-us__grid">
        <div v-for="(item, i) in WHY_US" :key="item.title" class="why-us__card" :style="{ '--delay': `${i * 0.1}s` }">
          <div class="why-us__icon-wrap">
            <span class="why-us__icon">{{ item.icon }}</span>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { WHY_US } from '@/constants';
</script>

<style lang="scss" scoped>
.why-us {
  padding: 56px 0;
  background: linear-gradient(180deg, $white 0%, $background-warm 100%);

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 24px;
  }

  &__card {
    @include card;
    padding: 32px 24px;
    text-align: center;
    border-top: 4px solid $gold;
    transition: $transition;

    &:hover {
      transform: translateY(-4px);
      box-shadow: $shadow-hover;
      border-top-color: $secondary;

      .why-us__icon-wrap { transform: scale(1.08); }
    }
  }

  &__icon-wrap {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(125, 60, 94, 0.08), rgba(240, 78, 139, 0.08));
    border-radius: 50%;
    transition: transform 0.35s ease;
  }

  &__icon { font-size: 2rem; display: block; }

  h3 {
    font-family: $font-display;
    font-size: 1.05rem;
    margin-bottom: 10px;
    color: $primary;
  }

  p { color: $text-muted; font-size: 0.9rem; line-height: 1.55; }
}
</style>
