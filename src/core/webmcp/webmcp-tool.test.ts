import {describe, expect, it} from 'vitest';
import {z} from 'zod';
import {createWebMcpTool} from './webmcp-tool';

describe('createWebMcpTool', () => {
    const schema = z.strictObject({
        query: z.string().min(1).max(8),
        limit: z.number().int().min(1).max(10).optional(),
    });

    it('advertises a closed Draft-07 object schema', () => {
        const tool = createWebMcpTool({
            name: 'test_tool',
            title: 'Test tool',
            description: 'Test',
            annotations: {readOnlyHint: true},
            inputSchema: schema,
            handler: (input) => ({ok: true, data: input, warnings: []}),
        });

        expect(tool.inputSchema).toMatchObject({
            $schema: 'http://json-schema.org/draft-07/schema#',
            type: 'object',
            additionalProperties: false,
        });
        expect(tool.inputSchema).toHaveProperty('properties.query.minLength', 1);
        expect(tool.inputSchema).toHaveProperty('properties.limit.maximum', 10);
    });

    it('maps strict Zod failures to one object invalid_input envelope', () => {
        const tool = createWebMcpTool({
            name: 'test_tool',
            title: 'Test tool',
            description: 'Test',
            annotations: {readOnlyHint: true},
            inputSchema: schema,
            handler: (input) => ({ok: true, data: input, warnings: []}),
        });

        const result = tool.execute({query: 'ok', extra: true});
        expect(result).toMatchObject({ok: false, error: {code: 'invalid_input'}});
        expect(typeof result).toBe('object');
    });

    it('returns one object envelope for sync and async handlers', async () => {
        const sync = createWebMcpTool({
            name: 'sync_tool',
            title: 'Sync',
            description: 'Sync',
            annotations: {readOnlyHint: true},
            inputSchema: z.strictObject({value: z.string()}),
            handler: (input) => ({ok: true, data: input, warnings: []}),
        });
        const asyncTool = createWebMcpTool({
            name: 'async_tool',
            title: 'Async',
            description: 'Async',
            annotations: {readOnlyHint: false},
            inputSchema: z.strictObject({value: z.string()}),
            handler: async (input) => ({ok: true, data: input, warnings: []}),
        });

        expect(sync.execute({value: 'x'})).toEqual({ok: true, data: {value: 'x'}, warnings: []});
        expect(await asyncTool.execute({value: 'x'})).toEqual({ok: true, data: {value: 'x'}, warnings: []});
    });

    it('passes the lifecycle signal and suppresses a stale async success', async () => {
        const controller = new AbortController();
        let resolve!: (value: {ok: true; data: string; warnings: []}) => void;
        const tool = createWebMcpTool({
            name: 'cancellable_tool',
            title: 'Cancellable',
            description: 'Cancellable',
            annotations: {readOnlyHint: true},
            inputSchema: z.strictObject({value: z.string()}),
            handler: async (_input, execution) => {
                expect(execution?.signal).toBe(controller.signal);
                return new Promise((done) => {
                    resolve = done;
                });
            },
        });

        const pending = tool.execute({value: 'x'}, {signal: controller.signal});
        controller.abort();
        resolve({ok: true, data: 'late', warnings: []});

        await expect(pending).resolves.toMatchObject({ok: false, error: {code: 'stale_context'}});
    });

    it('returns the abort envelope when an aborted handler catches and returns a failure', async () => {
        const controller = new AbortController();
        const tool = createWebMcpTool({
            name: 'caught_abort_tool',
            title: 'Caught abort',
            description: 'Caught abort',
            annotations: {readOnlyHint: true},
            inputSchema: z.strictObject({value: z.string()}),
            handler: async () => {
                await Promise.resolve();
                controller.abort();
                return {ok: false, error: {code: 'internal_error', message: 'late'}, contextId: 'old'} as any;
            },
        });

        await expect(tool.execute({value: 'x'}, {signal: controller.signal})).resolves.toMatchObject({
            ok: false,
            error: {code: 'stale_context'},
        });
    });
});
