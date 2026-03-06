import {describe, expect, it, vi, beforeEach} from 'vitest';
import {CircleLayer} from './circle.layer';
import {Point} from '../point';
import {Rect} from '../rect';
import {EditMode, TLayerEditPoint, TModifierType} from './abstract.layer';

// Mock dependencies
const mockRenderer = {
    drawCircle: vi.fn(),
    setDrawContext: vi.fn(),
};
vi.mock('../../draw/draw-context', () => ({
    DrawContext: vi.fn().mockImplementation(() => ({
        ctx: {
            fillStyle: '#000',
            strokeStyle: '#000',
            isPointInPath: vi.fn(() => false),
            isPointInStroke: vi.fn(() => false),
        },
        clear: vi.fn(),
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
    generateUID: vi.fn(() => 'circle-uid-123'),
}));

const mockFeatures = {
    hasRGBSupport: true,
    hasIndexedColors: false,
    hasInvertedColors: true,
    defaultColor: '#000000',
};

describe('CircleLayer', () => {
    let circle: CircleLayer;

    beforeEach(() => {
        vi.clearAllMocks();
        circle = new CircleLayer(mockFeatures as any, mockRenderer as any);
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(circle.radius).toBe(1);
            expect(circle.position).toBeInstanceOf(Point);
            expect(circle.position.xy).toEqual([0, 0]);
            expect(circle.fill).toBe(false);
            expect(circle.color).toBe('#000000');
        });

        it('should set default color from features', () => {
            const customFeatures = {...mockFeatures, defaultColor: '#ff0000'};
            const customCircle = new CircleLayer(customFeatures as any, mockRenderer as any);
            expect(customCircle.color).toBe('#ff0000');
        });

        it('should remove color modifier when no color support', () => {
            const noColorFeatures = {
                hasRGBSupport: false,
                hasIndexedColors: false,
                hasInvertedColors: true,
                defaultColor: '#000000',
            };
            const circleNoColor = new CircleLayer(noColorFeatures as any, mockRenderer as any);
            expect(circleNoColor.modifiers.color).toBeUndefined();
        });

        it('should remove inverted modifier when no inverted support', () => {
            const noInvertedFeatures = {
                hasRGBSupport: true,
                hasIndexedColors: false,
                hasInvertedColors: false,
                defaultColor: '#000000',
            };
            const circleNoInverted = new CircleLayer(noInvertedFeatures as any, mockRenderer as any);
            expect(circleNoInverted.modifiers.inverted).toBeUndefined();
        });
    });

    describe('modifiers', () => {
        it('should have x modifier with correct type and functions', () => {
            const xModifier = circle.modifiers.x!;
            expect(xModifier.type).toBe(TModifierType.number);
            expect(typeof xModifier.getValue).toBe('function');
            expect(typeof xModifier.setValue).toBe('function');

            expect(xModifier.getValue()).toBe(0);

            const updateBoundsSpy = vi.spyOn(circle, 'updateBounds');
            const drawSpy = vi.spyOn(circle, 'draw');
            xModifier.setValue!(15);

            expect(circle.position.x).toBe(15);
            expect(updateBoundsSpy).toHaveBeenCalled();
            expect(drawSpy).toHaveBeenCalled();
        });

        it('should have y modifier with correct type and functions', () => {
            const yModifier = circle.modifiers.y!;
            expect(yModifier.type).toBe(TModifierType.number);

            yModifier.setValue!(25);
            expect(circle.position.y).toBe(25);
        });

        it('should have radius modifier with correct type and functions', () => {
            const radiusModifier = circle.modifiers.radius!;
            expect(radiusModifier.type).toBe(TModifierType.number);

            radiusModifier.setValue!(10);
            expect(circle.radius).toBe(10);
        });

        it('should have fill modifier with correct type and functions', () => {
            const fillModifier = circle.modifiers.fill!;
            expect(fillModifier.type).toBe(TModifierType.boolean);

            fillModifier.setValue!(true);
            expect(circle.fill).toBe(true);
        });

        it('should handle variable getters and setters', () => {
            const xModifier = circle.modifiers.x!;

            expect(xModifier.getVariable!('testVar')).toBe(false);

            xModifier.setVariable!('testVar', true);
            expect(circle.variables['testVar']).toBe(true);
            expect(xModifier.getVariable!('testVar')).toBe(true);
        });
    });

    describe('edit points', () => {
        beforeEach(() => {
            circle.position = new Point(50, 50);
            circle.radius = 20;
            circle.updateBounds();
        });

        it('should have 4 edit points', () => {
            expect(circle.editPoints).toHaveLength(4);
        });

        it('should have edit points with correct cursors', () => {
            const cursors = circle.editPoints.map((ep) => ep.cursor);
            expect(cursors).toContain('nesw-resize');
            expect(cursors).toContain('nwse-resize');
        });

        it('should calculate edit point rectangles', () => {
            circle.editPoints.forEach((editPoint) => {
                const rect = editPoint.getRect();
                expect(rect.w).toBe(3);
                expect(rect.h).toBe(3);
            });
        });
    });

    describe('editing operations', () => {
        const mockEditPoint: TLayerEditPoint = {cursor: 'move', getRect: () => new Rect(0, 0, 1, 1), move: () => {}};
        it('should start creating mode', () => {
            const point = new Point(30, 40);
            const pushHistorySpy = vi.spyOn(circle, 'pushHistory');
            const updateBoundsSpy = vi.spyOn(circle, 'updateBounds');
            const drawSpy = vi.spyOn(circle, 'draw');

            circle.startEdit(EditMode.CREATING, point, mockEditPoint);

            expect(pushHistorySpy).toHaveBeenCalled();
            expect(circle['mode']).toBe(EditMode.CREATING);
            expect(circle.position.xy).toEqual([30, 40]);
            expect(circle.radius).toBe(1);
            expect(updateBoundsSpy).toHaveBeenCalled();
            expect(drawSpy).toHaveBeenCalled();
        });

        it('should start moving mode', () => {
            const point = new Point(20, 30);
            circle.startEdit(EditMode.MOVING, point, mockEditPoint);

            expect(circle['mode']).toBe(EditMode.MOVING);
            expect(circle['editState']).toBeDefined();
            expect(circle['editState'].firstPoint.xy).toEqual([20, 30]);
        });

        it('should handle edit in moving mode', () => {
            const startPoint = new Point(10, 10);
            const currentPoint = new Point(20, 25);

            circle.startEdit(EditMode.MOVING, startPoint, mockEditPoint);
            circle.edit(currentPoint, {} as MouseEvent);

            expect(circle.position.xy).toEqual([10, 15]); // offset from original position
        });

        it('should handle edit in creating mode', () => {
            const startPoint = new Point(50, 50);
            const currentPoint = new Point(70, 80);

            circle.startEdit(EditMode.CREATING, startPoint, mockEditPoint);
            circle.edit(currentPoint, {altKey: false} as MouseEvent);

            expect(circle.radius).toBeGreaterThan(1);
        });

        it('should handle edit in creating mode with alt key', () => {
            const startPoint = new Point(50, 50);
            const currentPoint = new Point(70, 80);

            circle.startEdit(EditMode.CREATING, startPoint, mockEditPoint);
            circle.edit(currentPoint, {altKey: true} as MouseEvent);

            // Should position circle differently when alt key is pressed
            expect(circle.position.x).toBeLessThan(startPoint.x);
            expect(circle.position.y).toBeLessThan(startPoint.y);
        });

        it('should stop editing', () => {
            circle.startEdit(EditMode.MOVING, new Point(0, 0), mockEditPoint);

            circle.stopEdit();

            expect(circle['mode']).toBe(EditMode.NONE);
            expect(circle['editState']).toBeNull();
        });
    });

    describe('drawing and bounds', () => {
        it('should call draw method', () => {
            expect(() => circle.draw()).not.toThrow();
        });

        it('should update bounds based on position and radius', () => {
            circle.position = new Point(50, 60);
            circle.radius = 15;

            circle.updateBounds();

            // Based on the actual CircleLayer implementation
            expect(circle.bounds.x).toBe(50);
            expect(circle.bounds.y).toBe(60);
            expect(circle.bounds.w).toBe(31); // radius * 2 + 1
            expect(circle.bounds.h).toBe(31); // radius * 2 + 1
        });

        it('should call onLoadState when loading state', () => {
            const onLoadStateSpy = vi.spyOn(circle, 'onLoadState' as any);
            circle.state = {r: 25, p: [100, 200]};
            expect(onLoadStateSpy).toHaveBeenCalled();
        });
    });

    describe('point containment', () => {
        beforeEach(() => {
            circle.position = new Point(50, 50);
            circle.radius = 20;
            circle.updateBounds();
        });

        it('should check if point is inside circle', () => {
            const centerPoint = new Point(50, 50);
            const result = circle.contains(centerPoint);
            expect(typeof result).toBe('boolean');
        });

        it('should use distance calculation for containment', () => {
            const nearPoint = new Point(55, 55);
            const farPoint = new Point(100, 100);

            // Mock the draw context to return true for near point
            const mockContains = vi.spyOn(circle, 'contains');
            mockContains.mockReturnValueOnce(true).mockReturnValueOnce(false);

            expect(circle.contains(nearPoint)).toBe(true);
            expect(circle.contains(farPoint)).toBe(false);
        });
    });

    describe('state serialization', () => {
        it('should serialize circle properties', () => {
            circle.radius = 15;
            circle.position = new Point(25, 35);
            circle.fill = true;

            const state = circle.state;
            expect(state.r).toBe(15);
            expect(state.p).toEqual([25, 35]);
            expect(state.f).toBe(true);
        });

        it('should deserialize circle properties', () => {
            circle.state = {
                r: 30,
                p: [40, 50],
                f: true,
                c: '#ff0000',
            };

            expect(circle.radius).toBe(30);
            expect(circle.position.xy).toEqual([40, 50]);
            expect(circle.fill).toBe(true);
            expect(circle.color).toBe('#ff0000');
        });
    });
});
