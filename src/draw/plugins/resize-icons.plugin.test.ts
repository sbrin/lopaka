import {describe, expect, it, vi} from 'vitest';
import {TLayerEditPoint} from '../../core/layers/abstract.layer';
import {PolygonLayer} from '../../core/layers/polygon.layer';
import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {TPlatformFeatures} from '../../platforms/platform';
import {ResizeIconsPlugin} from './resize-icons.plugin';

const createContext = () => {
    // Provide only drawing methods used by the resize icon plugin.
    return {
        save: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        arc: vi.fn(),
        rect: vi.fn(),
        stroke: vi.fn(),
        restore: vi.fn(),
        strokeStyle: '',
        lineWidth: 0,
    } as unknown as CanvasRenderingContext2D;
};

describe('ResizeIconsPlugin', () => {
    it('resolves triangle edit points from editor Shift state', () => {
        // Create a simple edit point so plugin has a drawable handle.
        const editPoint: TLayerEditPoint = {
            cursor: 'move',
            getRect: () => new Rect(10, 10, 3, 3),
            move: vi.fn(),
        };
        // Create a layer mock that captures the modifier passed to getEditPoints.
        const layer = {
            resizable: true,
            getEditPoints: vi.fn(() => [editPoint]),
        };
        // Build minimal session state with Shift enabled.
        const session = {
            state: {
                scale: new Point(1, 1),
            },
            // Stub platform features consumed by the plugin.
            getPlatformFeatures: vi.fn(() => ({
                interfaceColors: {
                    resizeIconColor: '#000000',
                },
            })),
            editor: {
                state: {
                    shiftPressed: true,
                },
            },
            layersManager: {
                selected: [layer],
            },
        };
        const plugin = new ResizeIconsPlugin(session as any);
        const ctx = createContext();

        // Draw resize icons and verify Shift is forwarded from editor state.
        plugin.update(ctx, null as unknown as Point, null as unknown as MouseEvent);
        expect(layer.getEditPoints).toHaveBeenCalledWith(expect.objectContaining({shiftKey: true}));
        expect(ctx.rect).toHaveBeenCalledWith(5.5, 5.5, 12, 12);
    });

    it('draws circular markers for polygon vertex edit mode', () => {
        const features: TPlatformFeatures = {
            hasCustomFontSize: false,
            hasInvertedColors: false,
            hasRGBSupport: true,
            hasIndexedColors: false,
            defaultColor: '#ffffff',
            interfaceColors: {
                selectColor: '#fff',
                resizeIconColor: '#000000',
                hoverColor: '#fff',
                rulerColor: '#fff',
                rulerLineColor: '#fff',
                selectionStrokeColor: '#fff',
            },
        };
        const layer = new PolygonLayer(features);
        layer.points = [[10, 10], [20, 10], [20, 20]];
        layer.updateBounds();
        layer.toggleVertexEditMode();
        const session = {
            state: {
                scale: new Point(4, 4),
            },
            getPlatformFeatures: vi.fn(() => ({
                interfaceColors: {
                    resizeIconColor: '#000000',
                },
            })),
            editor: {
                state: {
                    shiftPressed: false,
                },
            },
            layersManager: {
                selected: [layer],
            },
        };
        const plugin = new ResizeIconsPlugin(session as any);
        const ctx = createContext();

        plugin.update(ctx, null as unknown as Point, null as unknown as MouseEvent);

        expect(ctx.arc).toHaveBeenCalledWith(42, 42, 6, 0, Math.PI * 2);
        expect(ctx.rect).not.toHaveBeenCalled();
    });
});
