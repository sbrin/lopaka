import {describe, expect, it} from 'vitest';
import {z} from 'zod';
import {webMcpFailure, webMcpResult, webMcpSuccess} from './webmcp-envelope';
import {createWebMcpTool} from './webmcp-tool';

describe('WebMCP envelopes', () => {
    it('keeps success fields stable', () => {
        expect(webMcpSuccess({count: 2})).toEqual({ok: true, data: {count: 2}, warnings: []});
        expect(webMcpFailure({code: 'not_found', message: 'Missing'})).toEqual({
            ok: false,
            error: {code: 'not_found', message: 'Missing'},
        });
    });

    it('returns plain objects without serialization', () => {
        const value: {ok: true; data: Record<string, never>; warnings: string[]} = {ok: true, data: {}, warnings: []};
        expect(webMcpResult(value)).toBe(value);
        expect(typeof webMcpResult(value)).toBe('object');
    });

    it('rejects unknown fields and preserves strict bounds', () => {
        const tool = createWebMcpTool({
            name: 'bounded',
            title: 'Bounded',
            description: 'Bounded',
            annotations: {readOnlyHint: true},
            inputSchema: z.strictObject({value: z.string().min(1).max(4)}),
            handler: (input) => webMcpSuccess(input),
        });
        expect(tool.execute({value: 'ok'})).toMatchObject({ok: true});
        expect(tool.execute({value: '', extra: true})).toMatchObject({ok: false, error: {code: 'invalid_input'}});
        expect(tool.execute({value: '12345'})).toMatchObject({ok: false, error: {code: 'invalid_input'}});
    });

    const schema = z.strictObject({
        area: z.enum(['context', 'read-model']).optional(),
        id: z.string().min(1).max(8).optional(),
        count: z.number().finite().min(0).max(10).optional(),
        enabled: z.boolean().optional(),
        ids: z.array(z.string().min(1).max(8)).min(1).max(3).optional(),
        point: z.strictObject({x: z.number().min(0).max(128), y: z.number().min(0).max(128)}).optional(),
    });
    const tool = createWebMcpTool({
        name: 'parity',
        title: 'Parity',
        description: 'Parity',
        annotations: {readOnlyHint: true},
        inputSchema: schema,
        handler: (input) => webMcpSuccess(input),
    });
    const invalid = (input: unknown) =>
        expect(tool.execute(input)).toMatchObject({ok: false, error: {code: 'invalid_input'}});
    it('accepts omitted input', () => expect(tool.execute()).toMatchObject({ok: true}));
    it('accepts an empty object', () => expect(tool.execute({})).toMatchObject({ok: true}));
    it('accepts the first enum value', () => expect(tool.execute({area: 'context'})).toMatchObject({ok: true}));
    it('accepts the second enum value', () => expect(tool.execute({area: 'read-model'})).toMatchObject({ok: true}));
    it('rejects an enum value outside the set', () => invalid({area: 'billing'}));
    it('rejects a wrong enum type', () => invalid({area: 3}));
    it('accepts a minimum string length', () => expect(tool.execute({id: 'a'})).toMatchObject({ok: true}));
    it('accepts a maximum string length', () => expect(tool.execute({id: '12345678'})).toMatchObject({ok: true}));
    it('rejects an empty string', () => invalid({id: ''}));
    it('rejects an overlong string', () => invalid({id: '123456789'}));
    it('accepts a minimum number', () => expect(tool.execute({count: 0})).toMatchObject({ok: true}));
    it('accepts a maximum number', () => expect(tool.execute({count: 10})).toMatchObject({ok: true}));
    it('rejects a number below minimum', () => invalid({count: -1}));
    it('rejects a number above maximum', () => invalid({count: 11}));
    it('rejects non-finite numbers', () => invalid({count: Infinity}));
    it('accepts boolean values', () => expect(tool.execute({enabled: false})).toMatchObject({ok: true}));
    it('rejects non-boolean values', () => invalid({enabled: 'false'}));
    it('accepts a bounded string array', () => expect(tool.execute({ids: ['a', 'b']})).toMatchObject({ok: true}));
    it('rejects an empty string array', () => invalid({ids: []}));
    it('rejects an overlong string array', () => invalid({ids: ['a', 'b', 'c', 'd']}));
    it('rejects a wrong array item type', () => invalid({ids: ['a', 2]}));
    it('accepts closed point coordinates', () =>
        expect(tool.execute({point: {x: 0, y: 128}})).toMatchObject({ok: true}));
    it('rejects extra point keys', () => invalid({point: {x: 1, y: 2, z: 3}}));
    it('rejects an incomplete point', () => invalid({point: {x: 1}}));
    it('rejects unknown root keys', () => invalid({unknown: true}));
});
