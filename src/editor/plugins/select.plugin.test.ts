import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Keys } from '../../core/keys.enum';
import { RectangleLayer } from '../../core/layers/rectangle.layer';
import { PolygonLayer } from '../../core/layers/polygon.layer';
import { TriangleLayer } from '../../core/layers/triangle.layer';
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

    it('exits triangle vertex edit mode before clearing selection', () => {
        const triangle = new TriangleLayer(features);
        triangle.p1 = new Point(5, 0);
        triangle.p2 = new Point(10, 10);
        triangle.p3 = new Point(0, 10);
        triangle.updateBounds();
        triangle.selected = true;
        triangle.toggleVertexEditMode();

        const clearSelection = vi.fn(() => {
            triangle.selected = false;
        });
        const session = {
            editor: {
                state: {
                    activeTool: null,
                },
            },
            layersManager: {
                selected: [triangle],
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

        expect(triangle.vertexEditMode).toBe(false);
        expect(triangle.selected).toBe(true);
        expect(clearSelection).not.toHaveBeenCalled();
        expect(session.virtualScreen.redraw).toHaveBeenCalled();
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

    it('does not reset polygon vertex mode on repeated double click after group isolation', () => {
        const polygon = new PolygonLayer(features);
        polygon.points = [[20, 0], [30, 0], [30, 10]];
        polygon.group = 'Group 1';
        polygon.index = 2;
        polygon.updateBounds();
        polygon.selected = true;
        polygon.vertexEditMode = true;

        const sibling = new RectangleLayer(features);
        sibling.position = new Point(0, 0);
        sibling.size = new Point(10, 10);
        sibling.group = 'Group 1';
        sibling.index = 1;
        sibling.updateBounds();

        const layers = [sibling, polygon];
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
        plugin.selected = true;
        plugin.lastLayerId = polygon.uid;

        plugin.onMouseDoubleClick(new Point(25, 5), new MouseEvent('dblclick'));

        expect(polygon.selected).toBe(true);
        expect(polygon.vertexEditMode).toBe(true);
    });

    it('does not reset polygon vertex mode on double click when it is already the only selected layer', () => {
        const polygon = new PolygonLayer(features);
        polygon.points = [[0, 0], [10, 0], [10, 10]];
        polygon.index = 1;
        polygon.updateBounds();
        polygon.selected = true;
        polygon.vertexEditMode = true;

        const layers = [polygon];
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
                selected: layers,
                contains: vi.fn((point: Point) => layers.filter((layer) => layer.contains(point))),
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
                getLayersInGroup: vi.fn(() => []),
            },
            virtualScreen: {
                redraw: vi.fn(),
            },
        };

        const plugin = new SelectPlugin(session as any, container);

        plugin.onMouseDoubleClick(new Point(5, 5), new MouseEvent('dblclick'));

        expect(polygon.selected).toBe(true);
        expect(polygon.vertexEditMode).toBe(true);
        expect(session.layersManager.clearSelection).not.toHaveBeenCalled();
    });

    it('does not reset triangle vertex mode on repeated double click after group isolation', () => {
        const triangle = new TriangleLayer(features);
        triangle.p1 = new Point(25, 0);
        triangle.p2 = new Point(30, 10);
        triangle.p3 = new Point(20, 10);
        triangle.group = 'Group 1';
        triangle.index = 2;
        triangle.updateBounds();
        triangle.selected = true;
        triangle.vertexEditMode = true;

        const sibling = new RectangleLayer(features);
        sibling.position = new Point(0, 0);
        sibling.size = new Point(10, 10);
        sibling.group = 'Group 1';
        sibling.index = 1;
        sibling.updateBounds();

        const layers = [sibling, triangle];
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
        plugin.selected = true;
        plugin.lastLayerId = triangle.uid;

        plugin.onMouseDoubleClick(new Point(25, 5), new MouseEvent('dblclick'));

        expect(triangle.selected).toBe(true);
        expect(triangle.vertexEditMode).toBe(true);
    });

    it('does not reset triangle vertex mode on double click when it is already the only selected layer', () => {
        const triangle = new TriangleLayer(features);
        triangle.p1 = new Point(5, 0);
        triangle.p2 = new Point(10, 10);
        triangle.p3 = new Point(0, 10);
        triangle.index = 1;
        triangle.updateBounds();
        triangle.selected = true;
        triangle.vertexEditMode = true;

        const layers = [triangle];
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
                selected: layers,
                contains: vi.fn((point: Point) => layers.filter((layer) => layer.contains(point))),
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
                getLayersInGroup: vi.fn(() => []),
            },
            virtualScreen: {
                redraw: vi.fn(),
            },
        };

        const plugin = new SelectPlugin(session as any, container);

        plugin.onMouseDoubleClick(new Point(5, 5), new MouseEvent('dblclick'));

        expect(triangle.selected).toBe(true);
        expect(triangle.vertexEditMode).toBe(true);
        expect(session.layersManager.clearSelection).not.toHaveBeenCalled();
    });

    it('exits polygon vertex edit mode when selection moves to another layer', () => {
        const polygon = new PolygonLayer(features);
        polygon.points = [[0, 0], [10, 0], [10, 10]];
        polygon.index = 1;
        polygon.updateBounds();
        polygon.selected = true;
        polygon.toggleVertexEditMode();

        const rect = new RectangleLayer(features);
        rect.position = new Point(20, 0);
        rect.size = new Point(10, 10);
        rect.index = 2;
        rect.updateBounds();

        const layers = [polygon, rect];
        const selectedRef = () => layers.filter((layer) => layer.selected);
        const session = {
            editor: {
                state: {
                    activeTool: null,
                },
                selectionUpdate: vi.fn(),
            },
            layersManager: {
                layers,
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
                getLayersInGroup: vi.fn(() => []),
            },
            virtualScreen: {
                redraw: vi.fn(),
            },
        };

        const plugin = new SelectPlugin(session as any, container);

        plugin.onMouseDown(new Point(25, 5), new MouseEvent('mousedown'));

        expect(polygon.selected).toBe(false);
        expect(polygon.vertexEditMode).toBe(false);
        expect(rect.selected).toBe(true);
    });

    it('exits triangle vertex edit mode when selection moves to another layer', () => {
        const triangle = new TriangleLayer(features);
        triangle.p1 = new Point(5, 0);
        triangle.p2 = new Point(10, 10);
        triangle.p3 = new Point(0, 10);
        triangle.index = 1;
        triangle.updateBounds();
        triangle.selected = true;
        triangle.toggleVertexEditMode();

        const rect = new RectangleLayer(features);
        rect.position = new Point(20, 0);
        rect.size = new Point(10, 10);
        rect.index = 2;
        rect.updateBounds();

        const layers = [triangle, rect];
        const selectedRef = () => layers.filter((layer) => layer.selected);
        const session = {
            editor: {
                state: {
                    activeTool: null,
                },
                selectionUpdate: vi.fn(),
            },
            layersManager: {
                layers,
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
                getLayersInGroup: vi.fn(() => []),
            },
            virtualScreen: {
                redraw: vi.fn(),
            },
        };

        const plugin = new SelectPlugin(session as any, container);

        plugin.onMouseDown(new Point(25, 5), new MouseEvent('mousedown'));

        expect(triangle.selected).toBe(false);
        expect(triangle.vertexEditMode).toBe(false);
        expect(rect.selected).toBe(true);
    });
});
