import {describe, expect, it} from 'vitest';
import {TextLayer} from './text.layer';
import {TextAreaLayer} from './text-area.layer';
import {PaintLayer} from './paint.layer';
import {TPlatformFeatures} from '../../platforms/platform';
import {AbstractDrawingRenderer} from '../../draw/renderers';
import {DrawContext} from '../../draw/draw-context';
import {Font, FontFormat} from '../../draw/fonts/font';
import {Point} from '../point';

class TrackingRenderer extends AbstractDrawingRenderer {
    public contexts: DrawContext[] = [];

    public setDrawContext(dc: DrawContext) {
        // Record each draw context assignment for verification.
        this.contexts.push(dc);
        super.setDrawContext(dc);
    }

    clear(): void {
        // no-op for testing
    }

    drawRect(): void {
        // no-op for testing
    }

    drawRoundedRect(): void {
        // no-op for testing
    }

    drawCircle(): void {
        // no-op for testing
    }

    drawEllipse(): void {
        // no-op for testing
    }

    drawLine(): void {
        // no-op for testing
    }

    drawImage(): void {
        // no-op for testing
    }

    drawButton(): void {
        // no-op for testing
    }

    drawText(): void {
        // no-op for testing
    }

    drawPanel(): void {
        // no-op for testing
    }

    drawSwitch(): void {
        // no-op for testing
    }

    drawSlider(): void {
        // no-op for testing
    }

    drawCheckbox(): void {
        // no-op for testing
    }

    drawTriangle(): void {
        // no-op for testing
    }

    drawPolygon(): void {
        // no-op for testing
    }
}

const features: TPlatformFeatures = {
    hasCustomFontSize: true,
    hasInvertedColors: false,
    hasRGBSupport: true,
    defaultColor: '#000000',
    interfaceColors: {
        selectColor: '#fff',
        resizeIconColor: '#fff',
        hoverColor: '#fff',
        rulerColor: '#fff',
        rulerLineColor: '#fff',
        selectionStrokeColor: '#fff',
    },
};

const fakeFont: Font = {
    name: 'FakeFont',
    format: FontFormat.FORMAT_TTF,
    getSize: (_: unknown, text: string, scale: number) => new Point(text.length, scale),
    drawText: () => {
        // no-op for testing
    },
};

describe('Layer renderer isolation during cloning', () => {
    it('creates text layer clones with independent renderers and draw contexts', () => {
        // Arrange a text layer with a renderer that records draw context assignments.
        const renderer = new TrackingRenderer();
        const layer = new TextLayer(features, renderer, fakeFont);
        const originalContext = renderer.dc;

        // Act by cloning the text layer.
        const clone = layer.clone();

        // Assert renderer instances and draw contexts are isolated.
        // @ts-ignore accessing protected renderer for assertions
        expect(clone.renderer).not.toBe(layer.renderer);
        // @ts-ignore accessing protected renderer for assertions
        expect(clone.renderer.dc).not.toBe(layer.renderer.dc);
        expect(renderer.dc).toBe(originalContext);
        expect(renderer.contexts).toHaveLength(1);
    });

    it('creates text area clones without reusing the renderer or draw context', () => {
        // Arrange a text area layer with its own renderer.
        const renderer = new TrackingRenderer();
        const layer = new TextAreaLayer(features, renderer, fakeFont);
        const originalContext = renderer.dc;

        // Act by cloning the text area layer.
        const clone = layer.clone();

        // Assert renderer reuse does not occur across clones.
        // @ts-ignore accessing protected renderer for assertions
        expect(clone.renderer).not.toBe(layer.renderer);
        // @ts-ignore accessing protected renderer for assertions
        expect(clone.renderer.dc).not.toBe(layer.renderer.dc);
        expect(renderer.dc).toBe(originalContext);
        expect(renderer.contexts).toHaveLength(1);
    });

    it('creates paint layer clones with a fresh renderer and draw context', () => {
        // Arrange a paint layer with a tracked renderer.
        const renderer = new TrackingRenderer();
        const layer = new PaintLayer(features, renderer);
        const originalContext = renderer.dc;

        // Act by cloning the paint layer.
        const clone = layer.clone();

        // Assert the renderer and context are not shared between layers.
        // @ts-ignore accessing protected renderer for assertions
        expect(clone.renderer).not.toBe(layer.renderer);
        // @ts-ignore accessing protected renderer for assertions
        expect(clone.renderer.dc).not.toBe(layer.renderer.dc);
        expect(renderer.dc).toBe(originalContext);
        expect(renderer.contexts).toHaveLength(1);
    });
});
