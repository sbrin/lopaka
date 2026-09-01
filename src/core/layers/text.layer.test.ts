import {describe, expect, it, vi, beforeEach} from 'vitest';
import {TextLayer} from './text.layer';
import {Point} from '../point';
import {EditMode} from './abstract.layer';
import {FontFormat} from '../../draw/fonts/font';

// Mock dependencies (mirrors circle.layer.test.ts conventions).
vi.mock('../../draw/draw-context', () => ({
    DrawContext: vi.fn().mockImplementation(() => ({
        ctx: {
            fillStyle: '#000',
            strokeStyle: '#000',
            save: vi.fn(),
            restore: vi.fn(),
            beginPath: vi.fn(),
            rect: vi.fn(),
            fill: vi.fn(),
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
    generateUID: vi.fn(() => 'text-uid-123'),
}));

const mockFeatures = {
    hasRGBSupport: true,
    hasIndexedColors: false,
    hasInvertedColors: true,
    hasCustomFontSize: true,
    defaultColor: '#000000',
};

// A monospace-ish fake font: width scales with character count, fixed height.
const FAKE_FONT = {
    name: 'FakeFont',
    format: FontFormat.FORMAT_GFX,
    getSize: (_: unknown, text: string, scaleFactor: number) => new Point(text.length * 6 * scaleFactor, 10 * scaleFactor),
    drawText: vi.fn(),
};

const mockRenderer = {
    drawText: vi.fn(),
    setDrawContext: vi.fn(),
    dc: {ctx: {save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), rect: vi.fn(), fill: vi.fn()}},
};

describe('TextLayer canvas clamping', () => {
    let layer: TextLayer;
    const canvasSize = new Point(128, 64);

    beforeEach(() => {
        vi.clearAllMocks();
        layer = new TextLayer(mockFeatures as any, mockRenderer as any, FAKE_FONT as any);
        // Give the layer a real-sized buffer to clamp against, same as
        // AbstractLayer.resize() does when a layer is added to a session.
        layer.resize(canvasSize, new Point(1, 1));
        layer.text = 'Text';
        layer.updateBounds();
    });

    describe('x/y modifiers', () => {
        it('clamps x so the text does not go past the left edge', () => {
            layer.modifiers.x.setValue(-50);
            expect(layer.position.x).toBe(0);
        });

        it('clamps x so the text does not go past the right edge', () => {
            layer.modifiers.x.setValue(9999);
            expect(layer.position.x).toBe(canvasSize.x - layer.bounds.w);
        });

        it('allows x within bounds unchanged', () => {
            layer.modifiers.x.setValue(10);
            expect(layer.position.x).toBe(10);
        });

        it('clamps y so the top of the text does not go above the canvas', () => {
            // y is the text baseline; the minimum valid baseline keeps the
            // top of the bounds (y - height) at 0.
            layer.modifiers.y.setValue(0);
            expect(layer.position.y).toBe(layer.bounds.h);
        });

        it('clamps y so the text baseline does not go past the bottom edge', () => {
            layer.modifiers.y.setValue(9999);
            expect(layer.position.y).toBe(canvasSize.y);
        });

        it('allows y within bounds unchanged', () => {
            const validY = layer.bounds.h + 5;
            layer.modifiers.y.setValue(validY);
            expect(layer.position.y).toBe(validY);
        });
    });

    describe('drag (MOVING) clamping', () => {
        it('keeps a dragged text layer fully inside the canvas when dragged past the top-left corner', () => {
            layer.position = new Point(20, 20);
            layer.updateBounds();
            layer.startEdit(EditMode.MOVING, new Point(20, 20));

            // Drag far up-left, past the canvas origin.
            layer.edit(new Point(-500, -500), new MouseEvent('mousemove'));

            expect(layer.position.x).toBeGreaterThanOrEqual(0);
            expect(layer.position.y).toBeGreaterThanOrEqual(layer.bounds.h);
        });

        it('keeps a dragged text layer fully inside the canvas when dragged past the bottom-right corner', () => {
            layer.position = new Point(20, 20);
            layer.updateBounds();
            layer.startEdit(EditMode.MOVING, new Point(20, 20));

            // Drag far down-right, past the canvas edges.
            layer.edit(new Point(500, 500), new MouseEvent('mousemove'));

            expect(layer.position.x).toBeLessThanOrEqual(canvasSize.x - layer.bounds.w);
            expect(layer.position.y).toBeLessThanOrEqual(canvasSize.y);
        });

        it('does not clamp a drag that stays within canvas bounds', () => {
            layer.position = new Point(20, 20);
            layer.updateBounds();
            layer.startEdit(EditMode.MOVING, new Point(20, 20));

            // Small drag that stays well within the canvas.
            layer.edit(new Point(25, 25), new MouseEvent('mousemove'));

            expect(layer.position.equals(new Point(25, 25))).toBe(true);
        });
    });
});

