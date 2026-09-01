import {describe, expect, it, vi} from 'vitest';
import {buildWebMcpAssetLibraryTools} from './webmcp-asset-library';
import {buildWebMcpContextId, type TWebMcpContextSource} from './webmcp-context';
import {buildWebMcpToolCatalog, selectWebMcpToolNamesForContext} from './webmcp-capabilities';
import {Point} from '../point';
import {AssetLibraryError} from '../asset-library';

function source(overrides: Partial<TWebMcpContextSource> = {}): TWebMcpContextSource {
    return {
        mountId: 'mount-1',
        platform: 'u8g2',
        displayWidth: 128,
        displayHeight: 64,
        ...overrides,
    };
}

function fixture() {
    const layer: any = {
        uid: 'layer-1',
        name: 'battery',
        getType: () => 'paint',
        bounds: {x: 12, y: 8, w: 16, h: 8},
        position: new Point(12, 8),
        size: new Point(16, 8),
        hidden: false,
        locked: false,
        selected: true,
        group: null,
        modifiers: {},
        properties: {x: 12, y: 8, color: '#33AAFF'},
        actions: [],
    };
    const library: any = {
        search: vi.fn().mockResolvedValue({
            items: [
                {
                    assetId: 'icon:free:battery',
                    kind: 'icon',
                    source: 'builtin',
                    name: 'battery',
                    collection: 'Free',
                    width: 16,
                    height: 8,
                    colorMode: 'monochrome',
                    supportedProperties: ['x', 'y', 'color'],
                },
            ],
        }),
        preview: vi.fn().mockResolvedValue({
            assetId: 'icon:free:battery',
            pngDataUrl: 'data:image/png;base64,AA==',
            width: 16,
            height: 8,
        }),
        resolve: vi.fn().mockResolvedValue({
            assetId: 'icon:free:battery',
            kind: 'icon',
            source: 'builtin',
            name: 'battery',
            collection: 'Free',
            width: 16,
            height: 8,
            colorMode: 'monochrome',
            image: document.createElement('img'),
        }),
    };
    const session: any = {
        state: {platform: 'tft-espi', paintColorMode: 'monochrome'},
        getPlatformFeatures: () => ({hasRGBSupport: true}),
        layersManager: {sorted: [layer]},
        editorActions: {addAsset: vi.fn().mockResolvedValue({ok: true, data: {layer}})},
    };
    const definitions = buildWebMcpAssetLibraryTools({session, library, getContextSource: source});
    const tool = (name: string) => definitions.find((definition) => definition.name === name)!;
    return {definitions, tool, library, session};
}

describe('WebMCP asset library tools', () => {
    it('advertises two reads and one mutation', () => {
        const {definitions} = fixture();
        const catalog = buildWebMcpToolCatalog(definitions);
        expect(catalog).toEqual([
            {name: 'lopaka_search_assets', area: 'asset-library', mutating: false},
            {name: 'lopaka_get_asset', area: 'asset-library', mutating: false},
            {name: 'lopaka_add_asset', area: 'asset-library', mutating: true},
        ]);
        expect(selectWebMcpToolNamesForContext(source(), undefined, catalog)).toEqual([
            'lopaka_search_assets',
            'lopaka_get_asset',
            'lopaka_add_asset',
        ]);
    });

    it('searches and previews without leaking mutations', async () => {
        const {tool, library} = fixture();
        await expect(tool('lopaka_search_assets').execute({query: 'battery'})).resolves.toMatchObject({
            ok: true,
            data: {items: [{assetId: 'icon:free:battery', width: 16, height: 8}]},
        });
        await expect(tool('lopaka_get_asset').execute({assetId: 'icon:free:battery'})).resolves.toMatchObject({
            ok: true,
            data: {pngDataUrl: 'data:image/png;base64,AA=='},
        });
        expect(library.resolve).not.toHaveBeenCalled();
    });

    it('accepts only local asset kinds and sources', () => {
        const {tool} = fixture();
        expect(tool('lopaka_search_assets').execute({kinds: ['animation']})).toMatchObject({
            ok: false,
            error: {code: 'invalid_input'},
        });
        expect(tool('lopaka_search_assets').execute({sources: ['project']})).toMatchObject({
            ok: false,
            error: {code: 'invalid_input'},
        });
        expect(tool('lopaka_get_asset').execute({assetId: 'icon:free:battery', frameCount: 7})).toMatchObject({
            ok: false,
            error: {code: 'invalid_input'},
        });
    });

    it('adds at explicit coordinates with normalized color and returns a chainable layer id', async () => {
        const {tool, session} = fixture();
        const contextId = buildWebMcpContextId(source());
        await expect(
            tool('lopaka_add_asset').execute({
                contextId,
                assetId: 'icon:free:battery',
                x: 12,
                y: 8,
                color: '#33aaFF',
            })
        ).resolves.toMatchObject({
            ok: true,
            data: {layerId: 'layer-1', bounds: {x: 12, y: 8, width: 16, height: 8}},
            contextId,
            structureToken: expect.any(String),
        });
        expect(session.editorActions.addAsset).toHaveBeenCalledWith(
            expect.objectContaining({x: 12, y: 8, color: '#33aaFF'})
        );
    });

    it('rejects incomplete coordinates before resolving content', async () => {
        const {tool, library} = fixture();
        const result: any = await tool('lopaka_add_asset').execute({
            contextId: buildWebMcpContextId(source()),
            assetId: 'icon:free:battery',
            x: 12,
        });
        expect(result).toMatchObject({ok: false, error: {code: 'invalid_input'}});
        expect(library.resolve).not.toHaveBeenCalled();
    });

    it('aborts a pending resolve without publishing a partial layer', async () => {
        const {tool, library, session} = fixture();
        let finishResolve!: (asset: unknown) => void;
        library.resolve.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    finishResolve = resolve;
                })
        );
        const controller = new AbortController();
        const pending = tool('lopaka_add_asset').execute(
            {
                contextId: buildWebMcpContextId(source()),
                assetId: 'icon:free:battery',
            },
            {signal: controller.signal}
        );

        controller.abort();
        finishResolve({assetId: 'icon:free:battery'});

        await expect(pending).resolves.toMatchObject({ok: false, error: {code: 'stale_context'}});
        expect(session.editorActions.addAsset).not.toHaveBeenCalled();
    });
});
