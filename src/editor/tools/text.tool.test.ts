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
    const state = {
        display: new Point(128, 64),
        platform: PLATFORM_ID,
        customFonts: [] as TPlatformFont[],
        scale: new Point(1, 1),
    };
    const layers: AbstractLayer[] = [];
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
        getViewportCenterInCanvas: () => {
            const d = session.state.display;
            return new Point(d.x / 2, d.y / 2).round();
        },
    } as TestContext['editor'];
    session.editor = editor;
    return {editor, session, layers};
};

describe('TextTool', () => {
    beforeEach(() => {
        vi.spyOn(fonts, 'getFont').mockReturnValue(FAKE_FONT as any);
    });

    it('centers the text layer and exits the tool on activation', () => {
        const {editor, layers} = createTestContext();
        const tool = new TextTool(editor as any);

        tool.onActivate();

        expect(layers).toHaveLength(1);
        const layer = layers[0] as TextLayer;
        expect(layer).toBeInstanceOf(TextLayer);

        // Expected centered position derived from display center (64, 32)
        // and layer bounds (w=24, h=10):
        // x = max(0, min(128-24, 64-12)) = 52
        // y = max(0, min(64-10, 32-5))  = 27
        const expectedPosition = new Point(52, 27);
        expect(layer.position.equals(expectedPosition)).toBe(true);

        expect(editor.setTool).toHaveBeenCalledWith(null);
    });
});
