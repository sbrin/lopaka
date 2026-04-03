import {describe, expect, it, vi} from 'vitest';
import {PolygonLayer} from '../../core/layers/polygon.layer';
import {TriangleLayer} from '../../core/layers/triangle.layer';
import {Point} from '../../core/point';
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
    it('draws square markers for triangle resize mode', () => {
        const layer = new TriangleLayer({
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
        });
        layer.p1 = new Point(12, 10);
        layer.p2 = new Point(20, 20);
        layer.p3 = new Point(10, 20);
        layer.updateBounds();
        const session = {
            state: {
                scale: new Point(1, 1),
            },
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

        plugin.update(ctx, null as unknown as Point, null as unknown as MouseEvent);
        expect(ctx.rect).toHaveBeenCalledTimes(8);
        expect(ctx.arc).not.toHaveBeenCalled();
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

    it('draws circular markers for triangle vertex edit mode', () => {
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
        const layer = new TriangleLayer(features);
        layer.p1 = new Point(12, 10);
        layer.p2 = new Point(20, 20);
        layer.p3 = new Point(10, 20);
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

        expect(ctx.arc).toHaveBeenCalled();
        expect(ctx.rect).not.toHaveBeenCalled();
    });
});
