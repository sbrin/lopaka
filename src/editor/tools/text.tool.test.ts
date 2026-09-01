import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Point} from '../../core/point';
import {TextLayer} from '../../core/layers/text.layer';
import {TextTool} from './text.tool';
import {PixelatedDrawingRenderer} from '../../draw/renderers';
import {FontFormat} from '../../draw/fonts/font';
import type {AbstractLayer} from '../../core/layers/abstract.layer';
import type {TPlatformFeatures} from '../../platforms/platform';
import * as fonts from '/src/draw/fonts';

const PLATFORM_ID = 'lvgl';

const FEATURES: TPlatformFeatures = {
    hasCustomFontSize: true,
    hasInvertedColors: false,
    hasRGBSupport: true,
    hasIndexedColors: false,
    hasRoundCorners: true,
    defaultColor: '#ffffff',
    interfaceColors: {
        selectColor: '#fff',
        resizeIconColor: '#fff',
        hoverColor: '#fff',
        rulerColor: '#fff',
        rulerLineColor: '#fff',
        selectionStrokeColor: '#fff',
    },
};

const FAKE_FONT = {
    name: 'FakeFont',
    format: FontFormat.FORMAT_TTF,
    getSize: (_: unknown, text: string) => new Point(text.length * 6, 10),
    drawText: () => undefined,
};

const PLATFORM_FONTS: TPlatformFont[] = [
    {
        name: 'FakeFont',
        title: 'Fake Font',
        file: 'fake.ttf',
        format: FontFormat.FORMAT_TTF,
    },
];

type TestContext = {
    editor: {
        session: any;
        font: unknown;
        lastFontName: string | null;
        state: {
            activeLayer: AbstractLayer | null;
            activeTool: unknown;
        };
        setTool: (name: string | null) => void;
        getViewportCenterInCanvas: () => Point;
    };
    session: {
        state: {
            display: Point;
            platform: string;
            customFonts: TPlatformFont[];
            scale: Point;
        };
        platforms: Record<string, {getFonts: () => TPlatformFont[]}>;
        getPlatformFeatures: () => TPlatformFeatures;
        createRenderer: () => PixelatedDrawingRenderer;
        addLayer: (layer: AbstractLayer) => void;
        virtualScreen: {redraw: ReturnType<typeof vi.fn>};
        layersManager: {
            clearSelection: ReturnType<typeof vi.fn>;
            selectLayer: ReturnType<typeof vi.fn>;
        };
        editor: unknown;
    };
    layers: AbstractLayer[];
};

const createTestContext = (viewportCenter?: Point): TestContext => {
    // Build the session state needed for centering and rendering.
    const state = {
        display: new Point(128, 64),
        platform: PLATFORM_ID,
        customFonts: [] as TPlatformFont[],
        scale: new Point(1, 1),
    };
    // Track layers added during tool activation.
    const layers: AbstractLayer[] = [];
    // Stub session dependencies used by the tool.
    const session = {
        state,
        platforms: {
            [PLATFORM_ID]: {
                getFonts: () => PLATFORM_FONTS,
            },
        },
        getPlatformFeatures: () => FEATURES,
        createRenderer: () => new PixelatedDrawingRenderer(),
        addLayer: (layer: AbstractLayer) => {
            layer.resize(state.display, state.scale);
            layer.draw();
            layers.push(layer);
        },
        virtualScreen: {
            redraw: vi.fn(),
        },
        layersManager: {
            clearSelection: vi.fn(),
            selectLayer: vi.fn(),
        },
        editor: null,
    } as TestContext['session'];
    // Stub editor state and tool switching hooks.
    const editorState = {
        activeLayer: null as AbstractLayer | null,
        activeTool: null as unknown,
    };
    const editor = {
        session,
        font: null,
        lastFontName: null,
        state: editorState,
        setTool: vi.fn((name: string | null) => {
            editorState.activeTool = name ? {} : null;
        }),
        // Stub the viewport-center lookup: defaults to the display's
        // geometric center, matching Editor's fallback when unmounted.
        getViewportCenterInCanvas: () =>
            viewportCenter ?? new Point(state.display.x / 2, state.display.y / 2).round(),
    } as TestContext['editor'];
    // Wire the editor back onto the session for tool access.
    session.editor = editor;
    return {editor, session, layers};
};

describe('TextTool', () => {
    beforeEach(() => {
        // Stub font resolution for each test case.
        vi.spyOn(fonts, 'getFont').mockReturnValue(FAKE_FONT as any);
    });

    it('centers the text layer on the viewport center and exits the tool on activation', () => {
        const {editor, layers} = createTestContext();
        const tool = new TextTool(editor as any);

        tool.onActivate();

        expect(layers).toHaveLength(1);
        const layer = layers[0] as TextLayer;
        expect(layer).toBeInstanceOf(TextLayer);

        // Display center is (64, 32); text is 'Text' -> width 24, height 10.
        // x = max(0, min(128-24, 64-12)) = 52
        // y = max(10, min(64, 32+5)) = 37 (baseline sits below the visual center)
        const expectedPosition = new Point(52, 37);
        expect(layer.position.equals(expectedPosition)).toBe(true);

        expect(editor.setTool).toHaveBeenCalledWith(null);
    });

    it('centers on a scrolled viewport instead of the display center when provided', () => {
        // Simulate a viewport scrolled toward the bottom-right corner of the canvas.
        const {editor, layers} = createTestContext(new Point(100, 50));
        const tool = new TextTool(editor as any);

        tool.onActivate();

        const layer = layers[0] as TextLayer;
        // x = max(0, min(128-24, 100-12)) = 88
        // y = max(10, min(64, 50+5)) = 55
        expect(layer.position.equals(new Point(88, 55))).toBe(true);
    });

    it('clamps text placement to the canvas when the viewport center sits outside it', () => {
        // A viewport center beyond the canvas edge should still keep the
        // whole text layer inside the canvas bounds.
        const {editor, layers} = createTestContext(new Point(500, 500));
        const tool = new TextTool(editor as any);

        tool.onActivate();

        const layer = layers[0] as TextLayer;
        expect(layer.position.x).toBeLessThanOrEqual(128 - layer.bounds.w);
        expect(layer.position.y).toBeLessThanOrEqual(64);
        expect(layer.position.x).toBeGreaterThanOrEqual(0);
        expect(layer.position.y).toBeGreaterThanOrEqual(layer.bounds.h);
    });
});

