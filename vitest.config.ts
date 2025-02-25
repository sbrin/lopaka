import {UserConfig, defineConfig} from 'vitest/config';
import buildConfig from './vite.config.mjs';

export default defineConfig(
    Object.assign(buildConfig as UserConfig, {
        test: {
            globals: false,
            environment: 'jsdom',
            setupFiles: ['./test-polyfills.ts'],
            isolate: true,
            coverage: {
                reporter: ['text', 'json-summary', 'json'],
            },
        },
    })
);
