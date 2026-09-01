import {createApp} from 'vue';
import '../styles.css';
import AppVue from './components/App.vue';
import {loadWebMcpRuntime} from '/src/core/webmcp/webmcp-loader';

createApp(AppVue).mount('#lopaka_app');
void loadWebMcpRuntime().catch((error) => console.warn('Failed to load WebMCP runtime:', error));
