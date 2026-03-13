import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Keys } from '../../core/keys.enum';
import { RectangleLayer } from '../../core/layers/rectangle.layer';
import { PolygonLayer } from '../../core/layers/polygon.layer';
import { Point } from '../../core/point';
import { TPlatformFeatures } from '../../platforms/platform';
import { SelectPlugin } from './select.plugin';

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

describe('SelectPlugin Escape handling', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
    });

    it('exits polygon vertex edit mode before clearing selection', () => {
        const polygon = new PolygonLayer(features);
        polygon.points = [[0, 0], [10, 0], [10, 10]];
        polygon.updateBounds();
        polygon.selected = true;
        polygon.toggleVertexEditMode();

        const clearSelection = vi.fn(() => {
            polygon.selected = false;
        });
        const session = {
            editor: {
                state: {
                    activeTool: null,
                },
            },
            layersManager: {
                selected: [polygon],
                clearSelection,
                eachEditableLayer: vi.fn(),
                selectLayer: vi.fn(),
            },
            virtualScreen: {
                redraw: vi.fn(),
            },
        };

        const plugin = new SelectPlugin(session as any, container);

        plugin.onKeyDown(Keys.Escape, new KeyboardEvent('keydown', { code: Keys.Escape }));

        expect(polygon.vertexEditMode).toBe(false);
        expect(polygon.selected).toBe(true);
        expect(clearSelection).not.toHaveBeenCalled();
        expect(session.virtualScreen.redraw).toHaveBeenCalled();
    });

    it('clears selection on Escape when vertex edit mode is already off', () => {
        const polygon = new PolygonLayer(features);
        polygon.points = [[0, 0], [10, 0], [10, 10]];
        polygon.updateBounds();
        polygon.selected = true;

        const clearSelection = vi.fn(() => {
            polygon.selected = false;
        });
        const session = {
            editor: {
                state: {
                    activeTool: null,
                },
            },
            layersManager: {
                selected: [polygon],
                clearSelection,
                eachEditableLayer: vi.fn(),
                selectLayer: vi.fn(),
            },
            virtualScreen: {
                redraw: vi.fn(),
            },
        };

        const plugin = new SelectPlugin(session as any, container);

        plugin.onKeyDown(Keys.Escape, new KeyboardEvent('keydown', { code: Keys.Escape }));

        expect(clearSelection).toHaveBeenCalled();
        expect(polygon.selected).toBe(false);
    });

    it('selects the whole group on single click by default', () => {
        const first = new RectangleLayer(features);
        first.position = new Point(0, 0);
        first.size = new Point(10, 10);
        first.group = 'Group 1';
        first.index = 1;
        first.updateBounds();

        const second = new RectangleLayer(features);
        second.position = new Point(20, 0);
        second.size = new Point(10, 10);
        second.group = 'Group 1';
        second.index = 2;
        second.updateBounds();

        const layers = [first, second];
        const session = {
            editor: {
                state: {
                    activeTool: null,
                },
                selectionUpdate: vi.fn(),
            },
            layersManager: {
                layers,
                selected: [],
                clearSelection: vi.fn(() => {
                    layers.forEach((layer) => {
                        layer.selected = false;
                    });
                }),
                selectLayer: vi.fn((layer) => {
                    layer.selected = true;
                }),
                unselectLayer: vi.fn((layer) => {
                    layer.selected = false;
                }),
                eachLayer: vi.fn((cb) => layers.forEach(cb)),
                getLayersInGroup: vi.fn(() => layers),
            },
            virtualScreen: {
                redraw: vi.fn(),
            },
        };

        const plugin = new SelectPlugin(session as any, container);

        plugin.onMouseDown(new Point(5, 5), new MouseEvent('mousedown'));

        expect(first.selected).toBe(true);
        expect(second.selected).toBe(true);
    });

    it('selects a single layer inside the group after double click enters edit mode', () => {
        const first = new RectangleLayer(features);
        first.position = new Point(0, 0);
        first.size = new Point(10, 10);
        first.group = 'Group 1';
        first.index = 1;
        first.updateBounds();
        first.selected = true;

        const second = new RectangleLayer(features);
        second.position = new Point(20, 0);
        second.size = new Point(10, 10);
        second.group = 'Group 1';
        second.index = 2;
        second.updateBounds();
        second.selected = true;

        const layers = [first, second];
        const selectedRef = () => layers.filter((layer) => layer.selected);
        const session = {
            editor: {
                state: {
                    activeTool: null,
                },
                selectionUpdate: vi.fn(),
                triggerTextEdit: vi.fn(),
            },
            layersManager: {
                layers,
                contains: vi.fn((point: Point) => layers.filter((layer) => layer.contains(point))),
                get selected() {
                    return selectedRef();
                },
                clearSelection: vi.fn(() => {
                    layers.forEach((layer) => {
                        layer.selected = false;
                    });
                }),
                selectLayer: vi.fn((layer) => {
                    layer.selected = true;
                }),
                unselectLayer: vi.fn((layer) => {
                    layer.selected = false;
                }),
                eachLayer: vi.fn((cb) => layers.forEach(cb)),
                getLayersInGroup: vi.fn(() => layers),
            },
            virtualScreen: {
                redraw: vi.fn(),
            },
        };

        const plugin = new SelectPlugin(session as any, container);

        plugin.onMouseDoubleClick(new Point(25, 5), new MouseEvent('dblclick'));
        plugin.onMouseDown(new Point(25, 5), new MouseEvent('mousedown'));

        expect(first.selected).toBe(false);
        expect(second.selected).toBe(true);
    });
});
