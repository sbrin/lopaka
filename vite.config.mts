import basicSsl from '@vitejs/plugin-basic-ssl';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'path';
import {defineConfig} from 'vite';
import iconsPackPlugin from './vite-plugins/icons-pack';
import bdfFormatPlugin from './vite-plugins/bdf-format';
import gfxFormatPlugin from './vite-plugins/gfx-format';
import pugTemplatePlugin from './vite-plugins/pug-template';
import svgComponentPlugin from './vite-plugins/svg-component';

export default defineConfig({
    base: '/',
    plugins: [
        vue(),
        basicSsl(),
        iconsPackPlugin,
        bdfFormatPlugin,
        gfxFormatPlugin,
        pugTemplatePlugin,
        svgComponentPlugin,
    ],
    esbuild: {
        keepNames: true,
    },
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
                math: 'always',
            },
        },
    },
    build: {
        assetsInlineLimit: 0,
        sourcemap: true,
        rollupOptions: {
            treeshake: true,
            input: {
                app: resolve(__dirname, 'index.html'),
                fontPreview: resolve(__dirname, 'font-preview.html'),
            },
        },
    },
    define: {},
    server: {
        https: true,
        port: 3000,
        host: '0.0.0.0',
    },
});
