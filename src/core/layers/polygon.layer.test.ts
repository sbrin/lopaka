import { describe, expect, it } from 'vitest';
import { PolygonLayer } from './polygon.layer';
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

describe('PolygonLayer contains', () => {
    it('treats polygon interior as clickable regardless of fill', () => {
        const layer = new PolygonLayer(features);
        layer.points = [[0, 0], [10, 0], [10, 10], [0, 10]];
        layer.updateBounds();

        layer.fill = false;
        expect(layer.contains(new Point(5, 5))).toBe(true);

        layer.fill = true;
        expect(layer.contains(new Point(5, 5))).toBe(true);
    });

    it('still rejects points outside the polygon', () => {
        const layer = new PolygonLayer(features);
        layer.points = [[0, 0], [10, 0], [10, 10], [0, 10]];
        layer.updateBounds();

        expect(layer.contains(new Point(20, 20))).toBe(false);
    });
});
