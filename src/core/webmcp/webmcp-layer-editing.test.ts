import {beforeEach, describe, expect, it, vi} from 'vitest';
import {buildWebMcpEditorTools} from './webmcp-editor-tools';
import {buildWebMcpContextTools} from './webmcp-context-tools';
import {buildWebMcpToolCatalog} from './webmcp-capabilities';
import {createWebMcpStub, registerWebMcpToolDefinitions, type TWebMcpStub} from './webmcp-test-stub';
import {buildWebMcpContextId, type TWebMcpContextSource} from './webmcp-context';
import {LayersManager} from '../layers-manager';
import {ChangeHistory} from '../history';
import {Point} from '../point';
import {FontFormat} from '/src/draw/fonts/font';
import type {Font} from '/src/draw/fonts/font';
import * as fonts from '/src/draw/fonts';
import {Editor} from '/src/editor/editor';
import {U8g2Platform} from '/src/platforms/u8g2';
import {TFTeSPIPlatform} from '/src/platforms/tft-espi';
import platforms from '../platforms';
import {EditorActions} from '../editor-actions';

/**
 * Real font files are not loaded in unit tests, so text layers get a measurable
 * stand-in. Only text measurement and drawing are stubbed; the editing path
 * itself stays real.
 */
const FAKE_FONT = {
    name: 'FakeFont',
    format: FontFormat.FORMAT_TTF,
    getSize: (_: unknown, text: string): Point => new Point(String(text).length * 6, 10),
    drawText: (): void => undefined,
};

beforeEach(() => {
    vi.spyOn(fonts, 'getFont').mockReturnValue(FAKE_FONT as any);
});

function createContextSource(overrides: Partial<TWebMcpContextSource> = {}): TWebMcpContextSource {
    return {
        mountId: 'mount-1',
        platform: 'u8g2',
        displayWidth: 128,
        displayHeight: 64,
        ...overrides,
    };
}

const contextId = buildWebMcpContextId(createContextSource());

/**
 * A real Editor, LayersManager, and ChangeHistory over a minimal session, so
 * edits and deletions run through the same domain calls the editor UI uses.
 */
function createFixture({platform = U8g2Platform.id}: {platform?: string} = {}) {
    const history = new ChangeHistory();
    const redraw = vi.fn();
    const features = platforms[platform].features;

    const session: any = {
        state: {
            platform,
            display: {x: 128, y: 64},
            scale: {x: 1, y: 1},
            brushColor: '#ffffff',
            customFonts: [],
            immidiateUpdates: 0,
            selectionUpdates: 0,
        },
        platforms,
        history,
        virtualScreen: {redraw},
        getPlatformFeatures: () => features,
        createRenderer: (): undefined => undefined,
        generateCode: () => ({code: '', map: {}}),
        setBrushColor: vi.fn(),
        setLastColor: vi.fn(),
    };

    const editor = new Editor(session);
    session.editor = editor;

    const layersManager = new LayersManager(session);
    layersManager.requestUpdate = vi.fn();
    // Fonts are stubbed above, so loading is a no-op that still proves the
    // editing tool awaits it before applying a font change.
    layersManager.loadFontsForLayers = vi.fn().mockResolvedValue([]);
    session.layersManager = layersManager;
    session.editorActions = new EditorActions(session);
    session.addLayer = (layer: any, saveHistory = true) => layersManager.add(layer, saveHistory);

    // The real session subscribes this listener; undo does nothing without it.
    history.subscribe((event, change) => {
        layersManager.undoChange(event, change);
        redraw();
    });

    return {session, layersManager, history, editor, redraw};
}

async function registerTools(
    session: any,
    source: () => TWebMcpContextSource = createContextSource
): Promise<TWebMcpStub> {
    const stub = createWebMcpStub();
    const catalogRef: {current: ReturnType<typeof buildWebMcpToolCatalog>} = {current: []};
    const definitions = [
        ...buildWebMcpContextTools({
            getContextSource: source,
            getCapabilitySource: () => ({
                platform: session.state.platform,
                display: session.state.display,
                creatableLayerTypes: [],
            }),
            getCatalog: () => catalogRef.current,
        }),
        ...buildWebMcpEditorTools({session, getContextSource: source}),
    ];
    catalogRef.current = buildWebMcpToolCatalog(definitions);
    await registerWebMcpToolDefinitions(stub, definitions, undefined, source());
    return stub;
}

/** Create a layer through the creation tool, so edits act on a real layer. */
function create(stub: TWebMcpStub, input: Record<string, unknown>): string {
    const result = stub.call('lopaka_create_layer', {contextId, ...input}) as any;
    expect(result.ok).toBe(true);
    return result.data.layerId;
}

function update(stub: TWebMcpStub, input: Record<string, unknown>) {
    return stub.callAsync('lopaka_update_layer', {contextId, ...input}) as any;
}

function listed(stub: TWebMcpStub) {
    return (stub.call('lopaka_list_layers') as any).data.layers;
}

function structureToken(stub: TWebMcpStub): string {
    return (stub.call('lopaka_list_layers') as any).structureToken;
}

function propertyOf(stub: TWebMcpStub, layerId: string, name: string) {
    const detail = stub.call('lopaka_get_layer', {layerId}) as any;
    return detail.data.properties.find((property: any) => property.name === name);
}

describe('lopaka_update_layer', () => {
    it('is advertised on an editable screen', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);

        expect(stub.has('lopaka_update_layer')).toBe(true);
        expect(stub.tool('lopaka_update_layer').annotations.readOnlyHint).toBe(false);
    });

    it('moves a layer to a new position', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'rect', x: 4, y: 6, width: 20, height: 10});

        const result = await update(stub, {layerId, x: 30, y: 12});

        expect(result.ok).toBe(true);
        expect(result.data.bounds).toMatchObject({x: 30, y: 12});
        expect(listed(stub)[0].bounds).toMatchObject({x: 30, y: 12});
    });

    it('resizes a layer', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 20, height: 10});

        const result = await update(stub, {layerId, w: 40, h: 24});

        expect(result.ok).toBe(true);
        expect(result.data.bounds).toMatchObject({width: 40, height: 24});
    });

    it('changes the text of a text layer', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'string', x: 2, y: 8, text: 'Old'});

        const result = await update(stub, {layerId, text: 'New label'});

        expect(result.ok).toBe(true);
        expect(result.data.text).toBe('New label');
        expect(listed(stub)[0].text).toBe('New label');
    });

    it('accepts top-level coordinates when moving a text layer', async () => {
        const {session, history, layersManager} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'string', x: 47, y: 55, text: 'A'});

        const result = await update(stub, {layerId, x: 48, y: 48});

        expect(result).toMatchObject({ok: true});
        expect(result.data.bounds).toMatchObject({x: 48, y: 48});
        expect(result.data.properties).toEqual(
            expect.arrayContaining([
                expect.objectContaining({name: 'x', value: 48, editable: true}),
                expect.objectContaining({name: 'y', value: 48, editable: true}),
            ])
        );

        history.undo();
        expect(layersManager.getLayer(layerId).bounds).toMatchObject({x: 47, y: 55});
        history.redo();
        expect(layersManager.getLayer(layerId).bounds).toMatchObject({x: 48, y: 48});
    });

    it('publishes editable update fields at the top level', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const schema = stub.tool('lopaka_update_layer').inputSchema as any;

        expect(schema.additionalProperties).toBe(false);
        expect(schema.properties).toHaveProperty('x');
        expect(schema.properties).toHaveProperty('y');
        expect(schema.properties).toHaveProperty('text');
        expect(schema.properties).not.toHaveProperty('properties');
    });

    it('rejects a nested properties object under the top-level contract', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'string', x: 47, y: 55, text: 'A'});

        const result = await update(stub, {layerId, properties: {x: 48, y: 48}});

        expect(result).toMatchObject({ok: false, error: {code: 'invalid_input', details: {field: 'properties'}}});
        expect(listed(stub)[0].bounds).toMatchObject({x: 47, y: 55});
    });

    it('applies several properties in one request', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});

        const result = await update(stub, {layerId, x: 5, y: 7, w: 30, h: 20});

        expect(result.ok).toBe(true);
        expect(result.data.bounds).toMatchObject({x: 5, y: 7, width: 30, height: 20});
    });

    it('shares Inspector normalization and color memory', async () => {
        const {session} = createFixture({platform: TFTeSPIPlatform.id});
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});

        const result = await update(stub, {layerId, x: 17.8, color: 'aabbcc'});

        expect(result.ok).toBe(true);
        expect(result.data.bounds.x).toBe(17);
        expect(result.data.properties.find((property: any) => property.name === 'color').value).toBe('#AABBCC');
        expect(session.setBrushColor).toHaveBeenCalledWith('#AABBCC');
        expect(session.setLastColor).toHaveBeenCalledWith('#AABBCC');
    });

    it('records a multi-property change as one undoable step', async () => {
        const {session, history, layersManager} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});

        await update(stub, {layerId, x: 40, y: 25});
        history.undo();

        const layer = layersManager.getLayer(layerId);
        expect(layer.bounds.x).toBe(0);
        expect(layer.bounds.y).toBe(0);
    });

    it('renames a layer', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});

        const result = await update(stub, {layerId, name: 'Frame'});

        expect(result.ok).toBe(true);
        expect(listed(stub)[0].name).toBe('Frame');
    });

    it('toggles a boolean property', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});

        const result = await update(stub, {layerId, fill: true});

        expect(result.ok).toBe(true);
        expect(propertyOf(stub, layerId, 'fill').value).toBe(true);
    });

    it('loads the font before applying a font change', async () => {
        const {session, layersManager} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'string', x: 0, y: 8, text: 'Hi'});
        const fontName = platforms[U8g2Platform.id].getFonts()[0].name;

        const result = await update(stub, {layerId, font: fontName});

        expect(result.ok).toBe(true);
        expect(layersManager.loadFontsForLayers).toHaveBeenCalledWith([fontName]);
    });

    it('rejects a font the platform does not provide', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'string', x: 0, y: 8, text: 'Hi'});
        const before = propertyOf(stub, layerId, 'font').value;

        const result = await update(stub, {layerId, font: 'NoSuchFont'});

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('unsupported_for_platform');
        expect(propertyOf(stub, layerId, 'font').value).toBe(before);
    });

    it('rejects a property the layer does not expose', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});

        const result = await update(stub, {layerId, text: 'Not a text layer'});

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('invalid_input');
        expect(result.error.details.field).toBe('text');
    });

    it('rejects an unknown input property', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});

        const result = await update(stub, {layerId, nonsense: 1});

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('invalid_input');
    });

    it('rejects a value outside the supported range', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});

        const result = await update(stub, {layerId, x: 999999});

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('invalid_input');
        expect(listed(stub)[0].bounds.x).toBe(0);
    });

    it('requires at least one property to change', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});

        const result = await update(stub, {layerId});

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('invalid_input');
    });

    it('rejects an edit to a locked layer', async () => {
        const {session, layersManager} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});
        layersManager.lockLayer(layersManager.getLayer(layerId));

        const result = await update(stub, {layerId, x: 20});

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('invalid_input');
        expect(listed(stub)[0].bounds.x).toBe(0);
    });

    it('rejects an unknown layer', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});

        const result = await update(stub, {layerId: 'missing', x: 4});

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('not_found');
    });

    it('rejects a stale screen context', async () => {
        const {session} = createFixture();
        let source = createContextSource();
        const stub = await registerTools(session, () => source);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});

        source = createContextSource({platform: 'tft-espi'});
        const result = await update(stub, {layerId, x: 40});

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('stale_context');
        expect(listed(stub)[0].bounds.x).toBe(0);
    });
});

describe('lopaka_delete_layers', () => {
    it('removes one layer and reports the remaining stack', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const first = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});
        const second = create(stub, {type: 'rect', x: 20, y: 0, width: 10, height: 10});
        const initialUpdates = session.state.immidiateUpdates;

        const result = stub.call('lopaka_delete_layers', {
            contextId,
            structureToken: structureToken(stub),
            layerIds: [first],
        }) as any;

        expect(result.ok).toBe(true);
        expect(result.data.deletedLayerIds).toEqual([first]);
        expect(result.data.remainingLayerIds).toEqual([second]);
        expect(listed(stub)).toHaveLength(1);
        expect(session.state.immidiateUpdates).toBeGreaterThan(initialUpdates);
    });

    it('returns the next structure token', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const first = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});
        create(stub, {type: 'rect', x: 20, y: 0, width: 10, height: 10});
        const before = structureToken(stub);

        const result = stub.call('lopaka_delete_layers', {
            contextId,
            structureToken: before,
            layerIds: [first],
        }) as any;

        expect(result.structureToken).not.toBe(before);
        expect(result.structureToken).toBe(structureToken(stub));
    });

    it('removes several layers as one undoable step', async () => {
        const {session, history, layersManager} = createFixture();
        const stub = await registerTools(session);
        const first = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});
        const second = create(stub, {type: 'rect', x: 20, y: 0, width: 10, height: 10});

        stub.call('lopaka_delete_layers', {
            contextId,
            structureToken: structureToken(stub),
            layerIds: [first, second],
        });
        expect(layersManager.count).toBe(0);

        history.undo();
        expect(layersManager.count).toBe(2);
    });

    it('rejects a stale structure token', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const first = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});
        const stale = structureToken(stub);
        create(stub, {type: 'rect', x: 20, y: 0, width: 10, height: 10});

        const result = stub.call('lopaka_delete_layers', {
            contextId,
            structureToken: stale,
            layerIds: [first],
        }) as any;

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('stale_layer_state');
        expect(listed(stub)).toHaveLength(2);
    });

    it('rejects an unknown layer without removing anything', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const first = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});

        const result = stub.call('lopaka_delete_layers', {
            contextId,
            structureToken: structureToken(stub),
            layerIds: [first, 'missing'],
        }) as any;

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('not_found');
        expect(listed(stub)).toHaveLength(1);
    });

    it('rejects a locked layer', async () => {
        const {session, layersManager} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});
        layersManager.lockLayer(layersManager.getLayer(layerId));

        const result = stub.call('lopaka_delete_layers', {
            contextId,
            structureToken: structureToken(stub),
            layerIds: [layerId],
        }) as any;

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('invalid_input');
        expect(listed(stub)).toHaveLength(1);
    });

    it('rejects a repeated identifier', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});

        const result = stub.call('lopaka_delete_layers', {
            contextId,
            structureToken: structureToken(stub),
            layerIds: [layerId, layerId],
        }) as any;

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('invalid_input');
        expect(listed(stub)).toHaveLength(1);
    });

    it('rejects a stale screen context', async () => {
        const {session} = createFixture();
        let source = createContextSource();
        const stub = await registerTools(session, () => source);
        const layerId = create(stub, {type: 'rect', x: 0, y: 0, width: 10, height: 10});
        const token = structureToken(stub);

        source = createContextSource({platform: 'tft-espi'});
        const result = stub.call('lopaka_delete_layers', {
            contextId,
            structureToken: token,
            layerIds: [layerId],
        }) as any;

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('stale_context');
        expect(listed(stub)).toHaveLength(1);
    });
});
