import vue from '@vitejs/plugin-vue';
import {resolve} from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
    base: '',
    plugins: [vue()],
    esbuild: {
        keepNames: true
    },
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
                math: 'always'
            }
        }
    },
    resolve: {
        alias: {
            vue: 'vue/dist/vue.esm-bundler.js'
        }
    },
    build: {
        sourcemap: true,
        rollupOptions: {
            treeshake: true,
            input: {
                app: resolve(__dirname, 'index.html')
            }
        }
    },
    define: {},
    server: {
        https: false,
        port: 3000,
        host: '0.0.0.0'
    }
});
