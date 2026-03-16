import {describe, expect, it} from 'vitest';
import {TextAreaLayer} from './text-area.layer';
import {Point} from '../point';
import {PixelatedDrawingRenderer} from '../../draw/renderers/pixelated-drawing-renderer';
import {SmoothDrawingRenderer} from '../../draw/renderers/smooth-drawing-renderer';
import {FontFormat} from '../../draw/fonts/font';

describe('TextAreaLayer', () => {
    it('wraps text into multiple lines based on available width', () => {
        // Arrange a fake font with deterministic sizing.
        const fakeFont = {
            getSize: (_: unknown, text: string) => new Point(text.length * 6, 10),
            drawText: () => undefined,
            format: FontFormat.FORMAT_TTF,
        };
        // Arrange a renderer and text area layer.
        const renderer = new PixelatedDrawingRenderer();
        const layer = new TextAreaLayer(
            {
                hasCustomFontSize: true,
                hasInvertedColors: false,
                hasRGBSupport: true,
                defaultColor: '#000000',
            },
            renderer,
            fakeFont as any
        );
        // Set a fixed size that accounts for text padding and the default border width.
        layer.size = new Point(60, 30);
        // Remove border width to keep the wrap width deterministic.
        layer.borderWidth = 0;
        layer.text = 'Hello world';

        // Act by retrieving wrapped lines.
        const lines = layer.getWrappedLines();

        // Assert the words wrap to fit the container width.
        expect(lines).toEqual(['Hello', 'world']);
    });

    it('offsets text position by border width for smooth rendering', () => {
        // Capture draw positions for text rendering.
        const drawPositions: Point[] = [];
        // Arrange a fake font that records draw positions.
        const fakeFont = {
            getSize: (_: unknown, text: string) => new Point(text.length * 6, 10),
            drawText: (_: unknown, __: string, position: Point) => {
                drawPositions.push(new Point(position.x, position.y));
            },
            format: FontFormat.FORMAT_GFX,
            name: 'TestFont',
        };
        // Arrange a smooth renderer and text area layer.
        const renderer = new SmoothDrawingRenderer();
        const layer = new TextAreaLayer(
            {
                hasCustomFontSize: true,
                hasInvertedColors: false,
                hasRGBSupport: true,
                defaultColor: '#000000',
            },
            renderer,
            fakeFont as any
        );
        // Set a size and text that does not wrap.
        layer.position = new Point(5, 7);
        layer.size = new Point(120, 60);
        layer.text = 'Hello';
        // Draw without a border to capture the baseline position.
        layer.borderWidth = 0;
        layer.resize(new Point(200, 100), new Point(1, 1));
        // Draw with a border to capture the adjusted position.
        layer.borderWidth = 4;
        layer.draw();
        // Assert the border width shifts the text position on both axes.
        expect(drawPositions).toHaveLength(2);
        const withoutBorder = drawPositions[0];
        const withBorder = drawPositions[1];
        expect(withBorder.x - withoutBorder.x).toBe(4);
        expect(withBorder.y - withoutBorder.y).toBeCloseTo(4);
    });

    it('wraps hyphenated words by keeping the hyphen on the previous line', () => {
        // Arrange a fake font with deterministic sizing.
        const fakeFont = {
            getSize: (_: unknown, text: string) => new Point(text.length * 6, 10),
            drawText: () => undefined,
            format: FontFormat.FORMAT_TTF,
        };
        // Arrange a renderer and text area layer.
        const renderer = new PixelatedDrawingRenderer();
        const layer = new TextAreaLayer(
            {
                hasCustomFontSize: true,
                hasInvertedColors: false,
                hasRGBSupport: true,
                defaultColor: '#000000',
            },
            renderer,
            fakeFont as any
        );
        // Set a size that forces a break at the hyphen.
        layer.borderWidth = 0;
        layer.size = new Point(60, 30);
        layer.text = 'Hello-world';

        // Act by retrieving wrapped lines.
        const lines = layer.getWrappedLines();

        // Assert the word wraps at the hyphen with the hyphen preserved.
        expect(lines).toEqual(['Hello-', 'world']);
    });

    it('does not throw when border width exceeds radius', () => {
        // Arrange a fake font to avoid font asset loading.
        const fakeFont = {
            getSize: (_: unknown, text: string) => new Point(text.length * 6, 10),
            drawText: () => undefined,
            format: FontFormat.FORMAT_TTF,
        };
        // Arrange a smooth renderer to exercise roundRect behavior.
        const renderer = new SmoothDrawingRenderer();
        const layer = new TextAreaLayer(
            {
                hasCustomFontSize: true,
                hasInvertedColors: false,
                hasRGBSupport: true,
                defaultColor: '#000000',
            },
            renderer,
            fakeFont as any
        );
        // Force a radius smaller than the border width.
        layer.radius = 2;
        layer.borderWidth = 6;
        layer.backgroundColor = '#FFFFFF';
        layer.borderColor = '#000000';

        // Act/Assert by ensuring draw calls do not throw.
        expect(() => layer.resize(new Point(100, 60), new Point(1, 1))).not.toThrow();
    });
});
