import {describe, expect, it, vi} from 'vitest';
import {hasWebMcpModelContext, loadWebMcpRuntime, type WebMcpDocument} from './webmcp-loader';

describe('WebMCP runtime loader', () => {
    it('does not invoke the importer when modelContext is unsupported', async () => {
        const loader = vi.fn();
        const documentLike = {} as WebMcpDocument;

        expect(hasWebMcpModelContext(documentLike)).toBe(false);
        await expect(loadWebMcpRuntime({documentLike, loader})).resolves.toBeNull();
        expect(loader).not.toHaveBeenCalled();
    });

    it('uses the injectable importer only after feature detection', async () => {
        const registerTool = vi.fn(async () => undefined);
        const documentLike = {modelContext: {registerTool}} as unknown as WebMcpDocument;
        const createWebMcpRuntime = vi.fn(() => ({refresh: vi.fn(), dispose: vi.fn()}));
        const getWebMcpModelContext = vi.fn(() => documentLike.modelContext!);
        const loader = vi.fn(async () => ({createWebMcpRuntime, getWebMcpModelContext}) as any);

        await expect(loadWebMcpRuntime({documentLike, loader})).resolves.toBeTruthy();
        expect(loader).toHaveBeenCalledTimes(1);
        expect(getWebMcpModelContext).toHaveBeenCalledWith(documentLike);
        expect(createWebMcpRuntime).toHaveBeenCalledWith(documentLike.modelContext);
    });
});
