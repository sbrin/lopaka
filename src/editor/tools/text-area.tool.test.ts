import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Point} from '../../core/point';
import {TextAreaLayer} from '../../core/layers/text-area.layer';
import {TextAreaTool} from './text-area.tool';
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

const createTestContext = (): TestContext => {
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
    } as TestContext['editor'];
    // Wire the editor back onto the session for tool access.
    session.editor = editor;
    return {editor, session, layers};
};

describe('TextAreaTool', () => {
    beforeEach(() => {
        // Stub font resolution for each test case.
        vi.spyOn(fonts, 'getFont').mockReturnValue(FAKE_FONT as any);
    });

    it('centers the text area and updates hit testing on activation', () => {
        // Arrange a tool with stubbed editor/session context.
        const {editor, layers, session} = createTestContext();
        const tool = new TextAreaTool(editor as any);

        // Act by activating the tool to create the layer.
        tool.onActivate();

        // Assert a text area layer is created and centered.
        expect(layers).toHaveLength(1);
        const layer = layers[0] as TextAreaLayer;
        const expectedPosition = new Point(
            (session.state.display.x - layer.size.x) / 2,
            (session.state.display.y - layer.size.y) / 2
        ).round();
        expect(layer).toBeInstanceOf(TextAreaLayer);
        expect(layer.position.equals(expectedPosition)).toBe(true);

        // Assert bounds align to the centered position.
        expect(layer.bounds.x).toBe(layer.position.x);
        expect(layer.bounds.y).toBe(layer.position.y);
        expect(layer.bounds.w).toBe(layer.size.x);
        expect(layer.bounds.h).toBe(layer.size.y);

        // Assert hit testing succeeds for points inside the bounds.
        const centerPoint = layer.bounds.getCenter().round();
        expect(layer.contains(centerPoint)).toBe(true);
        expect(layer.contains(new Point(0, 0))).toBe(false);
    });
});
