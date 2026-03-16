import { UserConfig, defineConfig } from 'vitest/config';
import buildConfig from './vite.config.mts';

export default defineConfig(
    Object.assign(buildConfig as UserConfig, {
        test: {
            globals: false,
            environment: 'jsdom',
            setupFiles: ['./test-polyfills.ts'],
            isolate: true,
            exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**', '**/{karma,rollup,webpack,vite,vitest}.config.*'],
            coverage: {
                reporter: process.env.GITHUB_ACTIONS
                    ? ['text', 'json-summary', 'json']
                    : ['text', 'html'],
                reportOnFailure: true,
            },
        },
    })
);
