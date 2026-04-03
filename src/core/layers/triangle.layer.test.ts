import { describe, expect, it } from 'vitest';
import { TriangleLayer } from './triangle.layer';
import { EditMode } from './abstract.layer';
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

    it('switches between resize handles and vertex handles', () => {
        const layer = new TriangleLayer(features);
        layer.p1 = new Point(5, 0);
        layer.p2 = new Point(10, 10);
        layer.p3 = new Point(0, 10);
        layer.updateBounds();

        expect(layer.vertexEditMode).toBe(false);
        expect(layer.getEditPoints()).toHaveLength(8);

        layer.toggleVertexEditMode();

        expect(layer.vertexEditMode).toBe(true);
        expect(layer.getEditPoints()).toHaveLength(3);

        layer.exitVertexEditMode();

        expect(layer.vertexEditMode).toBe(false);
        expect(layer.getEditPoints()).toHaveLength(8);
    });

    it('keeps triangle proportions when resizing with Shift', () => {
        const layer = new TriangleLayer(features);
        layer.p1 = new Point(5, 0);
        layer.p2 = new Point(10, 10);
        layer.p3 = new Point(0, 10);
        layer.updateBounds();

        const initialRatio = (layer.bounds.w - 1) / (layer.bounds.h - 1);
        const editPoint = layer.getEditPoints()[1];
        layer.startEdit(EditMode.RESIZING, new Point(10, 0), editPoint);

        layer.edit(new Point(14, -4), new MouseEvent('mousemove', { shiftKey: true }));

        const resizedRatio = (layer.bounds.w - 1) / (layer.bounds.h - 1);
        expect(resizedRatio).toBe(initialRatio);
    });

    it('resizes the triangle around its center when resizing with Alt', () => {
        const layer = new TriangleLayer(features);
        layer.p1 = new Point(5, 0);
        layer.p2 = new Point(10, 10);
        layer.p3 = new Point(0, 10);
        layer.updateBounds();

        const centerBefore = new Point(
            layer.bounds.x + (layer.bounds.w - 1) / 2,
            layer.bounds.y + (layer.bounds.h - 1) / 2
        );
        const editPoint = layer.getEditPoints()[5];
        layer.startEdit(EditMode.RESIZING, new Point(10, 5), editPoint);

        layer.edit(new Point(14, 5), new MouseEvent('mousemove', { altKey: true }));

        const centerAfter = new Point(
            layer.bounds.x + (layer.bounds.w - 1) / 2,
            layer.bounds.y + (layer.bounds.h - 1) / 2
        );
        expect(centerAfter).toEqual(centerBefore);
    });
});
