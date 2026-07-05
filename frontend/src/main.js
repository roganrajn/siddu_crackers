import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { vScrollReveal } from './directives/scrollReveal.js';
import './styles/main.scss';

const app = createApp(App);
app.directive('scroll-reveal', vScrollReveal);
app.use(createPinia());
app.use(router);
app.mount('#app');
