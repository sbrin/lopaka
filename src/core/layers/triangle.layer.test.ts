import { describe, expect, it } from 'vitest';
import { TriangleLayer } from './triangle.layer';
import { Point } from '../point';
import { TPlatformFeatures } from '../../platforms/platform';

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

describe('TriangleLayer contains', () => {
    it('keeps triangle interior clickable regardless of fill', () => {
        const layer = new TriangleLayer(features);
        layer.p1 = new Point(0, 0);
        layer.p2 = new Point(10, 0);
        layer.p3 = new Point(0, 10);
        layer.updateBounds();

        layer.fill = false;
        expect(layer.contains(new Point(3, 3))).toBe(true);

        layer.fill = true;
        expect(layer.contains(new Point(3, 3))).toBe(true);
    });
});
