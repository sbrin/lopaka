import {beforeEach, describe, expect, it, vi} from 'vitest';
import {EditMode, TLayerEditPoint} from '../../core/layers/abstract.layer';
import {PolygonLayer} from '../../core/layers/polygon.layer';
import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {TPlatformFeatures} from '../../platforms/platform';
import {ResizePlugin} from './resize.plugin';
import {RectangleLayer} from '../../core/layers/rectangle.layer';

type MockLayer = {
    resizable: boolean;
    locked: boolean;
    hidden: boolean;
    bounds: Rect;
    editPoints: TLayerEditPoint[];
    getEditPoints: ReturnType<typeof vi.fn>;
    startEdit: ReturnType<typeof vi.fn>;
    edit: ReturnType<typeof vi.fn>;
    stopEdit: ReturnType<typeof vi.fn>;
};

const createMockLayer = (): MockLayer => {
    // Define a tiny base handle to validate expanded hit-area behavior.
    const editPoint: TLayerEditPoint = {
        cursor: 'nwse-resize',
        getRect: () => new Rect(10, 10, 3, 3),
        move: vi.fn(),
    };
    // Return a selected, resizable layer with one handle.
    return {
        resizable: true,
        locked: false,
        hidden: false,
        bounds: new Rect(0, 0, 20, 20),
        editPoints: [editPoint],
        getEditPoints: vi.fn(() => [editPoint]),
        startEdit: vi.fn(),
        edit: vi.fn(),
        stopEdit: vi.fn(),
    };
};

const createSession = (layer: MockLayer) => {
    // Provide the minimal session surface consumed by ResizePlugin.
    return {
        state: {
            scale: new Point(1, 1),
        },
        editor: {
            state: {
                activeTool: null,
            },
        },
        layersManager: {
            selected: [layer],
        },
        virtualScreen: {
            redraw: vi.fn(),
        },
    };
};

describe('ResizePlugin hit area', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        // Recreate a clean container for cursor assertions in each test.
        container = document.createElement('div');
    });

    it('starts resizing when pointer is inside the expanded handle zone', () => {
        // Arrange a plugin with one selected resizable layer.
        const layer = createMockLayer();
        const session = createSession(layer);
        const plugin = new ResizePlugin(session as any, container);
        // Use a pointer that is outside original 3x3 area but inside doubled hit-area.
        const point = new Point(13.5, 11);

        // Trigger resize detection using the expanded hit area.
        plugin.onMouseDown(point, new MouseEvent('mousedown'));

        // Verify resize mode starts with the expected handle.
        expect(layer.startEdit).toHaveBeenCalledWith(EditMode.RESIZING, point, layer.editPoints[0]);
        expect(plugin.captured).toBe(true);
    });

    it('sets resize cursor when pointer is inside the expanded handle zone', () => {
        // Arrange a plugin with one selected resizable layer.
        const layer = createMockLayer();
        const session = createSession(layer);
        const plugin = new ResizePlugin(session as any, container);

        // Move pointer near the handle, within the expanded hit area.
        plugin.onMouseMove(new Point(13.5, 11), new MouseEvent('mousemove'));

        // Verify cursor feedback uses the handle cursor.
        expect(container.style.cursor).toBe('nwse-resize');
    });

    it('does not start resizing outside the expanded handle zone', () => {
        // Arrange a plugin with one selected resizable layer.
        const layer = createMockLayer();
        const session = createSession(layer);
        const plugin = new ResizePlugin(session as any, container);

        // Click just beyond the doubled hit-area to confirm boundary.
        plugin.onMouseDown(new Point(14.6, 11), new MouseEvent('mousedown'));

        // Verify no resize capture begins outside the expanded zone.
        expect(layer.startEdit).not.toHaveBeenCalled();
        expect(plugin.captured).toBe(false);
    });

    it('removes a polygon vertex on right click in vertex edit mode', () => {
        const features: TPlatformFeatures = {
            hasCustomFontSize: false,
            hasInvertedColors: false,
            hasRGBSupport: true,
            hasIndexedColors: false,
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
        const layer = new PolygonLayer(features);
        layer.points = [[10, 10], [20, 10], [20, 20], [10, 20]];
        layer.updateBounds();
        layer.toggleVertexEditMode();
        const session = {
            state: { scale: new Point(1, 1) },
            editor: { state: { activeTool: null } },
            layersManager: {
                selected: [layer],
                removeLayer: vi.fn(),
            },
            virtualScreen: {
                redraw: vi.fn(),
            },
        };
        const plugin = new ResizePlugin(session as any, container);

        plugin.onMouseDown(new Point(10, 10), new MouseEvent('mousedown', { button: 2 }));

        expect(layer.points).toEqual([[20, 10], [20, 20], [10, 20]]);
        expect(session.layersManager.removeLayer).not.toHaveBeenCalled();
        expect(plugin.captured).toBe(true);
        plugin.onMouseUp(new Point(10, 10), new MouseEvent('mouseup', { button: 2 }));
        expect(plugin.captured).toBe(false);
    });

    it('removes the polygon layer when right click deletion leaves fewer than two vertices', () => {
        const features: TPlatformFeatures = {
            hasCustomFontSize: false,
            hasInvertedColors: false,
            hasRGBSupport: true,
            hasIndexedColors: false,
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
        const layer = new PolygonLayer(features);
        layer.points = [[10, 10], [20, 10]];
        layer.updateBounds();
        layer.toggleVertexEditMode();
        const session = {
            state: { scale: new Point(1, 1) },
            editor: { state: { activeTool: null } },
            layersManager: {
                selected: [layer],
                removeLayer: vi.fn(),
            },
            virtualScreen: {
                redraw: vi.fn(),
            },
        };
        const plugin = new ResizePlugin(session as any, container);

        plugin.onMouseDown(new Point(10, 10), new MouseEvent('mousedown', { button: 2 }));

        expect(session.layersManager.removeLayer).toHaveBeenCalledWith(layer);
        expect(plugin.captured).toBe(true);
        plugin.onMouseUp(new Point(10, 10), new MouseEvent('mouseup', { button: 2 }));
        expect(plugin.captured).toBe(false);
    });

    it('does not enter polygon vertex edit mode while a whole group is selected', () => {
        const features: TPlatformFeatures = {
            hasCustomFontSize: false,
            hasInvertedColors: false,
            hasRGBSupport: true,
            hasIndexedColors: false,
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
        const polygon = new PolygonLayer(features);
        polygon.points = [[10, 10], [20, 10], [20, 20]];
        polygon.updateBounds();
        polygon.selected = true;

        const rect = new RectangleLayer(features);
        rect.position = new Point(30, 10);
        rect.size = new Point(10, 10);
        rect.updateBounds();
        rect.selected = true;

        const session = {
            state: { scale: new Point(1, 1) },
            editor: { state: { activeTool: null } },
            layersManager: {
                layers: [polygon, rect],
                selected: [polygon, rect],
            },
            virtualScreen: {
                redraw: vi.fn(),
            },
        };
        const plugin = new ResizePlugin(session as any, container);

        plugin.onMouseDoubleClick(new Point(15, 15), new MouseEvent('dblclick'));

        expect(polygon.vertexEditMode).toBe(false);
        expect(session.virtualScreen.redraw).not.toHaveBeenCalled();
    });
});
