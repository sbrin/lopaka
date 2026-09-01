import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Point} from '../point';
import {EditorActions} from '../editor-actions';
import type {Session} from '../session';
import {buildWebMcpContextId, type TWebMcpContextSource} from './webmcp-context';
import {buildWebMcpScreenSetupTools} from './webmcp-screen-setup';
import {createWebMcpStub, registerWebMcpToolDefinitions} from './webmcp-test-stub';

function createFixture() {
    const storage = new Map<string, string>();
    const refreshOrder: string[] = [];
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
    });
    const preset = {title: '128x64', size: new Point(128, 64)};
    const platforms = {
        u8g2: {
            getName: () => 'U8g2',
            getDescription: () => 'U8g2',
            features: {hasRGBSupport: false, screenBgColor: '#000000'},
            displays: [preset],
        },
        lvgl: {
            getName: () => 'LVGL',
            getDescription: () => 'LVGL',
            features: {hasRGBSupport: true, hasMonochromeSupport: false, screenBgColor: '#FFFFFF'},
            displays: [{title: '240x240', size: new Point(240, 240)}],
        },
    };
    const backgroundLayer = {uid: 'layer-1', draw: vi.fn()};
    const session = {
        state: {platform: 'u8g2', display: new Point(128, 64), isDisplayCustom: false, immidiateUpdates: 0},
        platforms,
        layersManager: {
            sorted: [backgroundLayer],
            eachLayer(callback: (layer: typeof backgroundLayer) => void) {
                callback(backgroundLayer);
            },
        },
        virtualScreen: {redraw: vi.fn(() => refreshOrder.push('redraw'))},
        getDisplays() {
            return platforms[this.state.platform].displays;
        },
        setDisplay(display: Point) {
            this.state.display = display;
        },
        saveDisplayCustom(custom: boolean) {
            this.state.isDisplayCustom = custom;
        },
        async preparePlatform(platform: string) {
            this.state.platform = platform;
        },
    } as unknown as Session;
    session.layersManager.update = vi.fn(() => {
        refreshOrder.push('update');
        session.state.immidiateUpdates++;
    });
    session.editorActions = new EditorActions(session);
    const getContextSource = (): TWebMcpContextSource => ({
        mountId: 'mount-1',
        platform: session.state.platform,
        displayWidth: session.state.display.x,
        displayHeight: session.state.display.y,
    });
    return {session, getContextSource, storage, backgroundLayer, refreshOrder};
}

async function register(session: Session, getContextSource: () => TWebMcpContextSource) {
    const stub = createWebMcpStub();
    await registerWebMcpToolDefinitions(stub, buildWebMcpScreenSetupTools({session, getContextSource}));
    return stub;
}

describe('WebMCP screen setup', () => {
    beforeEach(() => vi.restoreAllMocks());

    it('lists platform metadata, presets, and the custom display range', async () => {
        const {session, getContextSource} = createFixture();
        const stub = await register(session, getContextSource);

        expect(stub.call('lopaka_get_screen_setup_options')).toMatchObject({
            ok: true,
            data: {
                platforms: [
                    {identifier: 'u8g2', monochrome: true, displays: [{width: 128, height: 64}]},
                    {identifier: 'lvgl', monochrome: false, displays: [{width: 240, height: 240}]},
                ],
                customDisplay: {minWidth: 1, maxWidth: 4096, wholePixels: true},
            },
        });
    });

    it('sets preset and custom display sizes while preserving layers', async () => {
        const {session, getContextSource, refreshOrder} = createFixture();
        const stub = await register(session, getContextSource);
        const layers = session.layersManager.sorted;

        const preset = stub.call('lopaka_set_display', {
            contextId: buildWebMcpContextId(getContextSource()),
            width: 128,
            height: 64,
        });
        expect(preset).toMatchObject({ok: true, data: {custom: false}});

        const custom = stub.call('lopaka_set_display', {
            contextId: buildWebMcpContextId(getContextSource()),
            width: 101,
            height: 73,
        });
        expect(custom).toMatchObject({ok: true, data: {width: 101, height: 73, custom: true}});
        expect(session.layersManager.sorted).toBe(layers);
        expect(refreshOrder.slice(-2)).toEqual(['redraw', 'update']);
    });

    it('rejects invalid dimensions and malformed colors without changing state', async () => {
        const {session, getContextSource} = createFixture();
        const stub = await register(session, getContextSource);
        const contextId = buildWebMcpContextId(getContextSource());

        expect(stub.call('lopaka_set_display', {contextId, width: 0, height: 64})).toMatchObject({
            ok: false,
            error: {code: 'invalid_input'},
        });
        expect(stub.call('lopaka_set_screen_background', {contextId, color: 'black'})).toMatchObject({
            ok: false,
            error: {code: 'invalid_input'},
        });
        expect(session.state.display).toMatchObject({x: 128, y: 64});
        expect(session.platforms.u8g2.features.screenBgColor).toBe('#000000');
    });

    it('persists the background and returns a fresh context after switching platform', async () => {
        const {session, getContextSource, storage, backgroundLayer, refreshOrder} = createFixture();
        const stub = await register(session, getContextSource);
        let contextId = buildWebMcpContextId(getContextSource());
        const initialUpdates = session.state.immidiateUpdates;

        expect(stub.call('lopaka_set_screen_background', {contextId, color: '#aabbcc'})).toMatchObject({
            ok: true,
            data: {color: '#AABBCC'},
        });
        expect(storage.get('lopaka_u8g2_color_bg')).toBe('#AABBCC');
        expect(backgroundLayer.draw).toHaveBeenCalled();
        expect(session.virtualScreen.redraw).toHaveBeenCalled();
        expect(refreshOrder.slice(-2)).toEqual(['redraw', 'update']);
        expect(session.state.immidiateUpdates).toBeGreaterThan(initialUpdates);

        const switched = await stub.callAsync('lopaka_set_platform', {contextId, platform: 'lvgl'});
        contextId = buildWebMcpContextId(getContextSource());
        expect(switched).toMatchObject({ok: true, data: {platform: 'lvgl'}, contextId});
        expect(session.state.platform).toBe('lvgl');

        expect(stub.call('lopaka_set_display', {contextId: 'stale', width: 240, height: 240})).toMatchObject({
            ok: false,
            error: {code: 'stale_context'},
        });
    });

    it('rejects an unknown platform without changing the active one', async () => {
        const {session, getContextSource} = createFixture();
        const stub = await register(session, getContextSource);

        expect(
            await stub.callAsync('lopaka_set_platform', {
                contextId: buildWebMcpContextId(getContextSource()),
                platform: 'unknown',
            })
        ).toMatchObject({ok: false, error: {code: 'unsupported_for_platform'}});
        expect(session.state.platform).toBe('u8g2');
    });
});
