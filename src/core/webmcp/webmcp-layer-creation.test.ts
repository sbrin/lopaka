import {beforeEach, describe, expect, it, vi} from 'vitest';
import {buildWebMcpEditorTools} from './webmcp-editor-tools';
import {buildWebMcpContextTools} from './webmcp-context-tools';
import {createWebMcpStub, registerWebMcpToolDefinitions, type TWebMcpStub} from './webmcp-test-stub';
import {buildWebMcpContextId, type TWebMcpContextSource} from './webmcp-context';
import {buildWebMcpToolCatalog} from './webmcp-capabilities';
import {LayersManager} from '../layers-manager';
import {ChangeHistory} from '../history';
import {Point} from '../point';
import {FontFormat} from '/src/draw/fonts/font';
import type {Font} from '/src/draw/fonts/font';
import * as fonts from '/src/draw/fonts';
import {Editor} from '/src/editor/editor';
import {AddPlugin} from '/src/editor/plugins/add.plugin';
import {EditorActions} from '../editor-actions';
import {U8g2Platform} from '/src/platforms/u8g2';
import {LVGLPlatform} from '/src/platforms/lvgl';
import {TFTeSPIPlatform} from '/src/platforms/tft-espi';
import {AdafruitPlatform} from '/src/platforms/adafruit';
import platforms from '../platforms';

/**
 * Real font files are not loaded in unit tests, so text layers get a measurable
 * stand-in. Only text measurement and drawing are stubbed; every other part of
 * the creation path stays real.
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
 * creation runs through the same tool objects and history the editor UI uses.
 */
function createFixture({
    platform = U8g2Platform.id,
    display = {x: 128, y: 64},
}: {platform?: string; display?: {x: number; y: number}} = {}) {
    const history = new ChangeHistory();
    const redraw = vi.fn();
    const features = platforms[platform].features;

    const session: any = {
        state: {
            platform,
            display,
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
    };

    const editor = new Editor(session);
    session.editor = editor;

    const layersManager = new LayersManager(session);
    layersManager.requestUpdate = vi.fn();
    session.layersManager = layersManager;
    session.editorActions = new EditorActions(session);
    session.addLayer = (layer: any, saveHistory = true) => layersManager.add(layer, saveHistory);

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

function create(stub: TWebMcpStub, input: Record<string, unknown>) {
    return stub.call('lopaka_create_layer', {contextId, ...input}) as any;
}

function listed(stub: TWebMcpStub) {
    return (stub.call('lopaka_list_layers') as any).data.layers;
}

/**
 * The type enum the tool actually advertises, which is the editor's supported
 * tools minus the release-one exclusions.
 */
function advertisedTypes(stub: TWebMcpStub): string[] {
    const schema = stub.tool('lopaka_create_layer').inputSchema as any;
    return schema.oneOf.map((branch: any) => branch.properties.type.const);
}

/** Raw editor support for a platform, before release-one exclusions. */
function editorTypes(session: any, platform: string): string[] {
    return Object.keys(session.editor.getSupportedTools(platform));
}

describe('lopaka_create_layer registration', () => {
    it('is registered as a mutating layer-creation tool', () => {
        const fixture = createFixture();
        const definitions = buildWebMcpEditorTools({session: fixture.session, getContextSource: createContextSource});
        const descriptor = buildWebMcpToolCatalog(definitions).find((tool) => tool.name === 'lopaka_create_layer');
        expect(descriptor).toEqual({name: 'lopaka_create_layer', area: 'layer-creation', mutating: true});
    });

    it('completes the catalog at exactly the documented tools', () => {
        const fixture = createFixture();
        const definitions = buildWebMcpEditorTools({session: fixture.session, getContextSource: createContextSource});
        expect(buildWebMcpToolCatalog(definitions).map((tool) => tool.name)).toEqual(
            definitions.map((tool) => tool.name)
        );
    });

    it('marks the tool as mutating and untrusted', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        expect(stub.tool('lopaka_create_layer').annotations).toEqual({
            readOnlyHint: false,
            untrustedContentHint: true,
        });
    });

    it('drives its type enum from the editor supported tools, not a static list', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const schema = stub.tool('lopaka_create_layer').inputSchema as any;

        // Everything the editor supports on this platform, minus the
        // release-one exclusions, and nothing else.
        expect(advertisedTypes(stub)).toEqual(
            editorTypes(session, U8g2Platform.id).filter((type) => !['image', 'animation'].includes(type))
        );
        expect(schema.oneOf.every((branch: any) => branch.additionalProperties === false)).toBe(true);
        expect(schema.oneOf.every((branch: any) => branch.required.includes('contextId'))).toBe(true);
    });

    it('publishes vertices as ordinary JSON Schema objects', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);
        const schema = stub.tool('lopaka_create_layer').inputSchema as any;

        const polygon = schema.oneOf.find((branch: any) => branch.properties.type.const === 'polygon');
        expect(polygon.properties.vertices.items).toMatchObject({
            type: 'object',
            properties: {x: {type: 'number'}, y: {type: 'number'}},
            required: ['x', 'y'],
            additionalProperties: false,
        });
    });

    it('keeps image and animation creation in their dedicated editor workflows', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);

        expect(editorTypes(session, U8g2Platform.id)).toContain('image');
        expect(advertisedTypes(stub)).not.toContain('image');

        const result = create(stub, {type: 'image'});
        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('unsupported_for_platform');
    });
});

describe('lopaka_create_layer supported types', () => {
    it('creates one selected layer for every type the platform supports', async () => {
        for (const platform of Object.keys(platforms)) {
            const advertised = advertisedTypes(await registerTools(createFixture({platform}).session));
            expect(advertised.length).toBeGreaterThan(0);

            for (const type of advertised) {
                const {session, layersManager} = createFixture({platform});
                const stub = await registerTools(session);

                const result = create(stub, {type});

                expect(result.ok, `${platform}/${type} should be creatable`).toBe(true);
                expect(layersManager.sorted).toHaveLength(1);
                expect(layersManager.sorted[0].selected).toBe(true);
                expect(result.data.layerId).toBe(layersManager.sorted[0].uid);
                expect(result.structureToken).toEqual(expect.any(String));
                expect(result.contextId).toBe(contextId);
            }
        }
    });

    it('reports the created layer through the read tools', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);

        const created = create(stub, {type: 'rect', x: 4, y: 6, width: 20, height: 10});
        const detail = stub.call('lopaka_get_layer', {layerId: created.data.layerId}) as any;

        expect(detail.ok).toBe(true);
        expect(detail.data.type).toBe('rect');
        expect(detail.data.layerId).toBe(created.data.layerId);
        expect(listed(stub).map((layer: any) => layer.layerId)).toEqual([created.data.layerId]);
    });

    it('returns a structure token that matches the one the read tools report', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);

        const created = create(stub, {type: 'rect'});

        expect(created.structureToken).toBe((stub.call('lopaka_list_layers') as any).structureToken);
    });
});

describe('lopaka_create_layer platform validation', () => {
    it('rejects a type the active platform does not support and leaves the screen unchanged', async () => {
        const {session, layersManager, history} = createFixture({platform: U8g2Platform.id});
        const stub = await registerTools(session);

        // The u8g2 platform has no button tool; LVGL does.
        expect(editorTypes(session, U8g2Platform.id)).not.toContain('button');
        const result = create(stub, {type: 'button'});

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('unsupported_for_platform');
        expect(layersManager.sorted).toHaveLength(0);
        expect(history.history).toHaveLength(0);
    });

    it('accepts on one platform the type another platform refuses', async () => {
        const lvgl = createFixture({platform: LVGLPlatform.id});
        const stub = await registerTools(lvgl.session);

        expect(create(stub, {type: 'button'}).ok).toBe(true);
        expect(lvgl.layersManager.sorted).toHaveLength(1);
    });
});

describe('lopaka_create_layer geometry', () => {
    it('uses the requested bounds for a bounded shape', async () => {
        const {session, layersManager} = createFixture({platform: TFTeSPIPlatform.id});
        const stub = await registerTools(session);

        create(stub, {type: 'rect', x: 10, y: 12, width: 30, height: 20});

        const layer = layersManager.sorted[0] as any;
        expect(layer.position.xy).toEqual([10, 12]);
        expect(layer.size.xy).toEqual([30, 20]);
    });

    it('centers a bounded shape when only its dimensions are supplied', async () => {
        const display = {x: 100, y: 80};
        const {session, layersManager} = createFixture({platform: TFTeSPIPlatform.id, display});
        const stub = await registerTools(session);

        const result = create(stub, {type: 'rect', width: 20, height: 10});

        expect(result.ok).toBe(true);
        const layer = layersManager.sorted[0] as any;
        expect(layer.position.xy).toEqual([40, 35]);
        expect(layer.size.xy).toEqual([20, 10]);
    });

    it('connects a line to the exact endpoints', async () => {
        const {session, layersManager} = createFixture();
        const stub = await registerTools(session);

        create(stub, {type: 'line', x1: 3, y1: 4, x2: 40, y2: 30});

        const layer = layersManager.sorted[0] as any;
        expect(layer.p1.xy).toEqual([3, 4]);
        expect(layer.p2.xy).toEqual([40, 30]);
    });

    it('preserves an explicit circle radius', async () => {
        const {session, layersManager} = createFixture({platform: AdafruitPlatform.id});
        const stub = await registerTools(session);

        create(stub, {type: 'circle', x: 10, y: 12, radius: 10});

        expect((layersManager.sorted[0] as any).radius).toBe(10);
    });

    it('uses the supplied triangle vertices and reports calculated bounds', async () => {
        const {session, layersManager} = createFixture();
        const stub = await registerTools(session);

        const result = create(stub, {
            type: 'triangle',
            vertices: [
                {x: 10, y: 10},
                {x: 40, y: 10},
                {x: 25, y: 35},
            ],
        });

        const layer = layersManager.sorted[0] as any;
        expect(layer.p1.xy).toEqual([10, 10]);
        expect(layer.p2.xy).toEqual([40, 10]);
        expect(layer.p3.xy).toEqual([25, 35]);
        expect(result.data.bounds).toMatchObject({x: 10, y: 10});
    });

    it('accepts the triangle coordinates exposed by layer updates', async () => {
        const {session, layersManager} = createFixture();
        const stub = await registerTools(session);

        const result = create(stub, {type: 'triangle', x1: 10, y1: 10, x2: 40, y2: 10, x3: 25, y3: 35});

        expect(result.ok).toBe(true);
        const layer = layersManager.sorted[0] as any;
        expect(layer.p1.xy).toEqual([10, 10]);
        expect(layer.p2.xy).toEqual([40, 10]);
        expect(layer.p3.xy).toEqual([25, 35]);
    });

    it('maps LVGL widget width and height before centering the layer', async () => {
        const display = {x: 240, y: 240};
        const {session, layersManager} = createFixture({platform: LVGLPlatform.id, display});
        const stub = await registerTools(session);

        const result = create(stub, {type: 'button', width: 120, height: 50});

        expect(result.ok).toBe(true);
        const layer = layersManager.sorted[0] as any;
        expect(layer.size.xy).toEqual([120, 50]);
        expect(layer.position.xy).toEqual([60, 95]);
    });

    it('completes a polygon in the supplied vertex order', async () => {
        const {session, layersManager} = createFixture();
        const stub = await registerTools(session);

        const result = create(stub, {
            type: 'polygon',
            vertices: [
                {x: 5, y: 5},
                {x: 30, y: 8},
                {x: 20, y: 30},
                {x: 8, y: 25},
            ],
        });

        expect(result.ok).toBe(true);
        expect((layersManager.sorted[0] as any).points).toEqual([
            [5, 5],
            [30, 8],
            [20, 30],
            [8, 25],
        ]);
    });

    it('rejects a polygon with fewer than three vertices and leaves nothing behind', async () => {
        const {session, layersManager, history} = createFixture();
        const stub = await registerTools(session);

        const result = create(stub, {
            type: 'polygon',
            vertices: [
                {x: 5, y: 5},
                {x: 30, y: 8},
            ],
        });

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('invalid_input');
        expect(layersManager.sorted).toHaveLength(0);
        expect(history.history).toHaveLength(0);
    });

    it('rejects a triangle that does not have exactly three vertices', async () => {
        const {session, layersManager} = createFixture();
        const stub = await registerTools(session);

        const result = create(stub, {
            type: 'triangle',
            vertices: [
                {x: 1, y: 1},
                {x: 5, y: 1},
                {x: 3, y: 6},
                {x: 2, y: 4},
            ],
        });

        expect(result.ok).toBe(false);
        expect(result.error).toMatchObject({code: 'invalid_input', details: {field: 'vertices'}});
        expect(layersManager.sorted).toHaveLength(0);
    });

    it('centers a default-sized widget the same way the editor tool does', async () => {
        const display = {x: 240, y: 240};
        const {session, layersManager} = createFixture({platform: LVGLPlatform.id, display});
        const stub = await registerTools(session);

        create(stub, {type: 'button'});

        const layer = layersManager.sorted[0] as any;
        expect(layer.position.xy).toEqual([
            Math.round((display.x - layer.size.x) / 2),
            Math.round((display.y - layer.size.y) / 2),
        ]);
    });

    it('creates an empty selected paint layer without a stroke', async () => {
        const {session, layersManager} = createFixture();
        const stub = await registerTools(session);

        const result = create(stub, {type: 'paint'});

        expect(result.ok).toBe(true);
        const layer = layersManager.sorted[0] as any;
        expect(layer.getType()).toBe('paint');
        expect(layer.selected).toBe(true);
        // Ready for a stroke, but carrying none: creation never paints.
        expect(layer.data ?? null).toBeNull();
    });

    it('keeps monochrome paint colour creation while omitting it for RGB paint', async () => {
        const monochrome = createFixture({platform: U8g2Platform.id});
        monochrome.session.state.paintColorMode = 'monochrome';
        const monochromeStub = await registerTools(monochrome.session);
        const monochromeResult = create(monochromeStub, {type: 'paint', color: '#123456'});

        expect(monochromeResult.ok).toBe(true);
        expect((monochrome.layersManager.sorted[0] as any).color).toBe('#123456'.toUpperCase());

        const rgb = createFixture({platform: TFTeSPIPlatform.id});
        rgb.session.state.paintColorMode = 'rgb';
        const rgbStub = await registerTools(rgb.session);
        const rgbResult = create(rgbStub, {type: 'paint', color: '#123456'});

        expect(rgbResult).toMatchObject({ok: false, error: {code: 'invalid_input'}});
        expect(rgb.layersManager.sorted).toHaveLength(0);
    });

    it('rejects fixed checkbox size and paint extents before insertion', async () => {
        const checkbox = createFixture({platform: LVGLPlatform.id});
        const checkboxStub = await registerTools(checkbox.session);
        const checkboxResult = create(checkboxStub, {type: 'checkbox', width: 100});

        expect(checkboxResult).toMatchObject({ok: false, error: {code: 'invalid_input'}});
        expect(checkbox.layersManager.sorted).toHaveLength(0);
        expect(checkbox.history.history).toHaveLength(0);

        const paint = createFixture({platform: U8g2Platform.id});
        const paintStub = await registerTools(paint.session);
        const paintResult = create(paintStub, {type: 'paint', width: 10, height: 10});

        expect(paintResult).toMatchObject({ok: false, error: {code: 'invalid_input'}});
        expect(paint.layersManager.sorted).toHaveLength(0);
        expect(paint.history.history).toHaveLength(0);
    });
});

describe('lopaka_create_layer text properties', () => {
    it('keeps the exact requested text content', async () => {
        const {session, layersManager} = createFixture({platform: TFTeSPIPlatform.id});
        const stub = await registerTools(session);

        create(stub, {type: 'string', text: 'Hello 42', x: 8, y: 20, color: '#ff0000'});

        const layer = layersManager.sorted[0] as any;
        expect(layer.text).toBe('Hello 42');
        // Text stores a baseline position, so the requested x/y is the top-left
        // corner of the rendered text rather than the stored position.
        expect(layer.bounds.pos.xy).toEqual([8, 20]);
        expect(layer.color).toBe('#FF0000');
    });

    it('preserves multiline text area content and bounds', async () => {
        const {session, layersManager} = createFixture({platform: LVGLPlatform.id});
        const stub = await registerTools(session);

        const text = 'first line\nsecond line';
        create(stub, {type: 'textarea', text, x: 5, y: 5, width: 90, height: 40});

        const layer = layersManager.sorted[0] as any;
        expect(layer.text).toBe(text);
        expect(layer.position.xy).toEqual([5, 5]);
    });

    it('loads a requested available font and rejects an unavailable one', async () => {
        const {session, layersManager} = createFixture();
        const loadFonts = vi.spyOn(layersManager, 'loadFontsForLayers').mockResolvedValue([]);
        const stub = await registerTools(session);
        const font = platforms[session.state.platform].getFonts()[0].name;

        await expect(
            stub.callAsync('lopaka_create_layer', {contextId, type: 'string', text: 'Hi', font})
        ).resolves.toMatchObject({
            ok: true,
        });
        expect(loadFonts).toHaveBeenCalledWith([font]);
        await expect(
            stub.callAsync('lopaka_create_layer', {contextId, type: 'string', text: 'Hi', font: 'Missing'})
        ).resolves.toMatchObject({ok: false, error: {code: 'invalid_input', details: {field: 'font'}}});
    });
});

describe('lopaka_create_layer input validation', () => {
    it('rejects a property the requested type does not support', async () => {
        const {session, layersManager} = createFixture();
        const stub = await registerTools(session);

        const result = create(stub, {type: 'rect', text: 'not a rectangle property'});

        expect(result.ok).toBe(false);
        expect(result.error).toMatchObject({code: 'invalid_input', details: {field: 'text'}});
        expect(layersManager.sorted).toHaveLength(0);
    });

    it('rejects platform-hidden colour and arc properties before insertion', async () => {
        const monochrome = createFixture({platform: U8g2Platform.id});
        const monochromeStub = await registerTools(monochrome.session);
        const colourResult = create(monochromeStub, {type: 'rect', color: '#ffffff'});

        expect(colourResult).toMatchObject({ok: false, error: {code: 'invalid_input'}});
        expect(monochrome.layersManager.sorted).toHaveLength(0);

        const lvgl = createFixture({platform: LVGLPlatform.id});
        const lvglStub = await registerTools(lvgl.session);
        const arcResult = create(lvglStub, {type: 'arcLvgl', smooth: true});

        expect(arcResult).toMatchObject({ok: false, error: {code: 'invalid_input'}});
        expect(lvgl.layersManager.sorted).toHaveLength(0);
    });

    it('rejects a property that is unknown to every type', async () => {
        const {session, layersManager} = createFixture();
        const stub = await registerTools(session);

        const result = create(stub, {type: 'rect', nonsense: 1});

        expect(result.ok).toBe(false);
        expect(result.error).toMatchObject({code: 'invalid_input', details: {field: 'nonsense'}});
        expect(layersManager.sorted).toHaveLength(0);
    });

    it('rejects a missing type and a missing contextId', async () => {
        const {session} = createFixture();
        const stub = await registerTools(session);

        expect((stub.call('lopaka_create_layer', {contextId}) as any).error).toMatchObject({
            code: 'invalid_input',
            details: {field: 'type'},
        });
        expect((stub.call('lopaka_create_layer', {type: 'rect'}) as any).error).toMatchObject({
            code: 'invalid_input',
            details: {field: 'contextId'},
        });
    });

    it('rejects geometry outside the supported numeric range', async () => {
        const {session, layersManager} = createFixture();
        const stub = await registerTools(session);

        const result = create(stub, {type: 'rect', x: 10_000_000, y: 0, width: 5, height: 5});

        expect(result.ok).toBe(false);
        expect(result.error).toMatchObject({code: 'invalid_input', details: {field: 'x'}});
        expect(layersManager.sorted).toHaveLength(0);
    });

    it('rejects a malformed vertex', async () => {
        const {session, layersManager} = createFixture();
        const stub = await registerTools(session);

        const result = create(stub, {
            type: 'polygon',
            vertices: [{x: 1, y: 1}, {x: 5}, {x: 3, y: 6}],
        });

        expect(result.ok).toBe(false);
        expect(result.error).toMatchObject({code: 'invalid_input', details: {field: 'vertices'}});
        expect(layersManager.sorted).toHaveLength(0);
    });
});

describe('lopaka_create_layer context and history', () => {
    it('keeps UI pointer creation and WebMCP creation state in parity', async () => {
        const ui = createFixture();
        const addPlugin = new AddPlugin(ui.session, {} as any);
        ui.editor.state.activeTool = ui.editor.tools.rect;
        addPlugin.onMouseDown(new Point(4, 6), new MouseEvent('mousedown'));
        addPlugin.onMouseMove(new Point(24, 16), new MouseEvent('mousemove'));
        addPlugin.onMouseUp(new Point(24, 16), new MouseEvent('mouseup'));
        const uiLayer = ui.layersManager.sorted[0];

        const agent = createFixture();
        const stub = await registerTools(agent.session);
        const result = create(stub, {type: 'rect', x: 4, y: 6, width: 20, height: 10});
        const agentLayer = agent.layersManager.sorted[0];

        const {u: _uiUid, ...uiState} = uiLayer.state;
        const {u: _agentUid, ...agentState} = agentLayer.state;
        expect(agentState).toEqual(uiState);
        expect(agentLayer.selected).toBe(uiLayer.selected);
        expect(agent.editor.state.activeLayer).toBeNull();
        expect(agent.history.history).toHaveLength(1);
        expect(result.ok).toBe(true);
    });

    it('rejects a stale context identifier and creates nothing', async () => {
        const {session, layersManager, history} = createFixture();
        let platform = 'u8g2';
        const stub = await registerTools(session, () => createContextSource({platform}));

        // The user switches screens after the agent read the context.
        platform = 'tft-espi';
        const result = create(stub, {type: 'rect', x: 1, y: 1, width: 4, height: 4});

        expect(result.ok).toBe(false);
        expect(result.error.code).toBe('stale_context');
        expect(layersManager.sorted).toHaveLength(0);
        expect(history.history).toHaveLength(0);
    });

    it('reports a stale context before judging the type against the platform', async () => {
        const {session, layersManager} = createFixture({platform: U8g2Platform.id});
        let platform = 'u8g2';
        const stub = await registerTools(session, () => createContextSource({platform}));

        platform = 'tft-espi';
        // `button` is unsupported here, but the stale context is the earlier
        // and more actionable failure.
        const result = create(stub, {type: 'button'});

        expect(result.error.code).toBe('stale_context');
        expect(layersManager.sorted).toHaveLength(0);
    });

    it('records exactly one undoable add entry', async () => {
        const {session, history} = createFixture();
        const stub = await registerTools(session);

        create(stub, {type: 'rect', x: 2, y: 2, width: 10, height: 8});

        expect(history.history).toHaveLength(1);
        expect(history.history[0].type).toBe('add');
    });

    it('adds one history entry per created layer', async () => {
        const {session, history, layersManager} = createFixture();
        const stub = await registerTools(session);

        create(stub, {type: 'rect', x: 0, y: 0, width: 5, height: 5});
        create(stub, {type: 'line', x1: 0, y1: 0, x2: 9, y2: 9});

        expect(layersManager.sorted).toHaveLength(2);
        expect(history.history).toHaveLength(2);
    });
});
