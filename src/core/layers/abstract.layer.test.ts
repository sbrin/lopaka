import {describe, expect, it, vi, beforeEach, Mock} from 'vitest';
import {AbstractLayer, EditMode, TModifierType} from './abstract.layer';
import {Point} from '../point';
import {Rect} from '../rect';

// Mock dependencies
vi.mock('../../draw/draw-context', () => ({
    DrawContext: vi.fn().mockImplementation(() => ({
        ctx: {
            fillStyle: '#000',
            strokeStyle: '#000',
            isPointInPath: vi.fn(() => false),
            isPointInStroke: vi.fn(() => false),
        },
    })),
}));

vi.mock('../history', () => ({
    useHistory: vi.fn(() => ({
        push: vi.fn(),
        pushRedo: vi.fn(),
        clear: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
    })),
}));

vi.mock('../../utils', () => ({
    generateUID: vi.fn(() => 'test-uid-123'),
}));

// Create a concrete implementation for testing
class TestLayer extends AbstractLayer {
    protected type = 'test' as any;

    startEdit(mode: EditMode, point?: Point) {
        this.mode = mode;
    }

    edit(point: Point) {
        // Test implementation
    }

    stopEdit() {
        this.mode = EditMode.NONE;
    }

    draw() {
        // Test implementation
    }

    updateBounds() {
        this.bounds = new Rect(0, 0, 100, 100);
    }

    isMoving(): boolean {
        return this.mode === EditMode.MOVING;
    }

    isResizing(): boolean {
        return this.mode === EditMode.RESIZING;
    }

    getType() {
        return this.type;
    }

    getIcon() {
        return this.type;
    }

    getDC() {
        return this.dc;
    }
}

describe('AbstractLayer', () => {
    let layer: TestLayer;

    beforeEach(() => {
        layer = new TestLayer();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(layer.uid).toBe('test-uid-123');
            expect(layer.selected).toBe(false);
            expect(layer.bounds).toBeInstanceOf(Rect);
            expect(layer.color).toBe('#ffffff');
            expect(layer.inverted).toBe(false);
            expect(layer.overlay).toBe(false);
            expect(layer.locked).toBe(false);
            expect(layer.hidden).toBe(false);
            expect(layer.added).toBe(false);
            expect(layer.resizable).toBe(true);
            expect(layer.variables).toEqual({});
        });

        it('should accept platform features', () => {
            const features = {hasRGBSupport: true, defaultColor: '#ff0000'};
            const layerWithFeatures = new TestLayer(features as any);
            expect(layerWithFeatures).toBeDefined();
        });
    });

    describe('state management', () => {
        it('should get state using mapping decorator', () => {
            const state = layer.state;
            expect(typeof state).toBe('object');
        });

        it('should set state and call onLoadState', () => {
            const onLoadStateSpy = vi.spyOn(layer, 'onLoadState' as any);
            const newState = {color: '#ff0000'};

            layer.state = newState;

            expect(onLoadStateSpy).toHaveBeenCalled();
        });
    });

    describe('editing modes', () => {
        it('should check if layer is moving', () => {
            layer.startEdit(EditMode.MOVING);
            expect(layer.isMoving()).toBe(true);

            layer.startEdit(EditMode.RESIZING);
            expect(layer.isMoving()).toBe(false);
        });

        it('should check if layer is resizing', () => {
            layer.startEdit(EditMode.RESIZING);
            expect(layer.isResizing()).toBe(true);

            layer.startEdit(EditMode.MOVING);
            expect(layer.isResizing()).toBe(false);
        });

        it('should check if layer is editing', () => {
            layer.startEdit(EditMode.NONE);
            expect(layer.isEditing()).toBe(false);

            layer.startEdit(EditMode.MOVING);
            expect(layer.isEditing()).toBe(true);
        });
    });

    describe('canvas management', () => {
        it('should resize buffer and redraw', () => {
            const drawSpy = vi.spyOn(layer, 'draw');
            const display = new Point(128, 64);
            const scale = new Point(2, 2);

            layer.startEdit(EditMode.CREATING); // Set mode to non-empty
            layer.resize(display, scale);

            expect(layer.getBuffer().width).toBe(128);
            expect(layer.getBuffer().height).toBe(64);
            expect(drawSpy).toHaveBeenCalled();
        });

        it('should redraw even when mode is empty to initialize', () => {
            const drawSpy = vi.spyOn(layer, 'draw');
            const display = new Point(128, 64);
            const scale = new Point(2, 2);

            // mode is EMPTY by default
            layer.resize(display, scale);

            expect(drawSpy).toHaveBeenCalledTimes(1);
        });

        it('should return buffer', () => {
            const buffer = layer.getBuffer();
            expect(buffer).toBeInstanceOf(OffscreenCanvas);
        });
    });

    describe('layer operations', () => {
        it('should clone layer', () => {
            layer.name = 'Test Layer';
            layer.color = '#ff0000';

            const cloned = layer.clone();

            expect(cloned).toBeInstanceOf(TestLayer);
            expect(cloned).not.toBe(layer);
            expect(cloned.name).toBe('Test Layer');
            expect(cloned.color).toBe('#ff0000');
            
            // @ts-ignore - accessing protected property for testing
            expect(cloned.renderer).not.toBe(layer.renderer);
            // @ts-ignore
            expect(cloned.renderer.dc).not.toBe(layer.renderer.dc);
        });

        it('should set layer name', () => {
            layer.setName('New Name');
            expect(layer.name).toBe('New Name');
        });

        it('should check if point is contained', () => {
            const point = new Point(50, 50);
            // Set bounds so the AABB fast-path passes
            layer.bounds = new Rect(0, 0, 100, 100);
            const dc = layer.getDC();
            // Mock isPointInPath to return true
            (dc.ctx.isPointInPath as Mock).mockReturnValue(true);
            expect(layer.contains(point)).toBe(true);

            // Mock isPointInPath to return false and isPointInStroke to return true
            (dc.ctx.isPointInPath as Mock).mockReturnValue(false);
            (dc.ctx.isPointInStroke as Mock).mockReturnValue(true);
            expect(layer.contains(point)).toBe(true);

            // Mock both to return false
            (dc.ctx.isPointInPath as Mock).mockReturnValue(false);
            (dc.ctx.isPointInStroke as Mock).mockReturnValue(false);
            expect(layer.contains(point)).toBe(false);

            // Point outside bounds should return false without calling canvas methods
            (dc.ctx.isPointInPath as Mock).mockClear();
            (dc.ctx.isPointInStroke as Mock).mockClear();
            const outsidePoint = new Point(200, 200);
            expect(layer.contains(outsidePoint)).toBe(false);
            expect(dc.ctx.isPointInPath).not.toHaveBeenCalled();
            expect(dc.ctx.isPointInStroke).not.toHaveBeenCalled();
        });
    });

    describe('history management', () => {
        it('should push to history if not in EMPTY or CREATING mode', () => {
            const pushSpy = vi.spyOn(layer['history'], 'push');

            // Should not push in EMPTY mode
            layer.startEdit(EditMode.EMPTY);
            layer.pushHistory();
            expect(pushSpy).not.toHaveBeenCalled();

            // Should not push in CREATING mode
            layer.startEdit(EditMode.CREATING);
            layer.pushHistory();
            expect(pushSpy).not.toHaveBeenCalled();

            // Should push in another mode (e.g., MOVING)
            layer.startEdit(EditMode.MOVING);
            layer.pushHistory();
            expect(pushSpy).toHaveBeenCalledWith({
                type: 'change',
                layer: layer,
                state: layer.state,
            });
        });

        it('should push to redo history', () => {
            const pushRedoSpy = vi.spyOn(layer['history'], 'pushRedo');
            layer.pushRedoHistory();
            expect(pushRedoSpy).toHaveBeenCalledWith({
                type: 'change',
                layer: layer,
                state: layer.state,
            });
        });
    });

    describe('type and properties', () => {
        it('should return layer type', () => {
            const type = layer.getType();
            expect(type).toBe('test');
        });

        it('should have modifiers object', () => {
            expect(layer.modifiers).toBeDefined();
            expect(typeof layer.modifiers).toBe('object');
        });

        it('should have actions array', () => {
            expect(Array.isArray(layer.actions)).toBe(true);
        });

        it('should have editPoints array', () => {
            expect(Array.isArray(layer.editPoints)).toBe(true);
        });
    });

    describe('modifier types enum', () => {
        it('should have all expected modifier types', () => {
            // TModifierType appears to be a numeric enum, not string enum
            expect(typeof TModifierType.string).toBe('number');
            expect(typeof TModifierType.number).toBe('number');
            expect(typeof TModifierType.boolean).toBe('number');
            expect(typeof TModifierType.font).toBe('number');
            expect(typeof TModifierType.image).toBe('number');
            expect(typeof TModifierType.color).toBe('number');
        });
    });

    describe('edit modes enum', () => {
        it('should have all expected edit modes', () => {
            expect(EditMode.MOVING).toBeDefined();
            expect(EditMode.RESIZING).toBeDefined();
            expect(EditMode.CREATING).toBeDefined();
            expect(EditMode.DRAWING).toBeDefined();
            expect(EditMode.ERASING).toBeDefined();
            expect(EditMode.NONE).toBeDefined();
            expect(EditMode.EMPTY).toBeDefined();
        });
    });

    describe('layer state flags', () => {
        it('should handle selected state', () => {
            expect(layer.selected).toBe(false);
            layer.selected = true;
            expect(layer.selected).toBe(true);
        });

        it('should handle locked state', () => {
            expect(layer.locked).toBe(false);
            layer.locked = true;
            expect(layer.locked).toBe(true);
        });

        it('should handle hidden state', () => {
            expect(layer.hidden).toBe(false);
            layer.hidden = true;
            expect(layer.hidden).toBe(true);
        });

        it('should handle overlay state', () => {
            expect(layer.overlay).toBe(false);
            layer.overlay = true;
            expect(layer.overlay).toBe(true);
        });

        it('should handle inverted state', () => {
            expect(layer.inverted).toBe(false);
            layer.inverted = true;
            expect(layer.inverted).toBe(true);
        });
    });
});
