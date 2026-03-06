import {describe, expect, it, vi} from 'vitest';
import {TLayerEditPoint} from '../../core/layers/abstract.layer';
import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {ResizeIconsPlugin} from './resize-icons.plugin';

const createContext = () => {
    // Provide only drawing methods used by the resize icon plugin.
    return {
        save: vi.fn(),
        beginPath: vi.fn(),
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
        expect(ctx.rect).toHaveBeenCalled();
    });
});
