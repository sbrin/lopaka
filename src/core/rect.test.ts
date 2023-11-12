import {describe, expect, it} from 'vitest';
import {Point} from './point';
describe('Point and rect', () => {
    it('Point constructors', () => {
        let point: Point = new Point();
        expect(point.x).toBe(0);
        expect(point.y).toBe(0);

        point = new Point(1);
        expect(point.x).toBe(1);
        expect(point.y).toBe(1);

        point = new Point([1, 2]);
        expect(point.x).toBe(1);
        expect(point.y).toBe(2);

        point = new Point(1, 2);
        expect(point.x).toBe(1);
        expect(point.y).toBe(2);
    });

    it('Point getters and setters', () => {
        let point: Point = new Point(1, 2);
        expect(point.xy).toEqual([1, 2]);

        point.x = 3;
        point.y = 4;
        expect(point.x).toBe(3);
        expect(point.y).toBe(4);

        point.xy = [1, 2];
        expect(point.x).toBe(1);
        expect(point.y).toBe(2);
    });

    it('Point math: add', () => {
        let point: Point = new Point(1, 2);

        point.add(1);
        expect(point.xy).toEqual([2, 3]);

        point.add(2, 3);
        expect(point.xy).toEqual([4, 6]);

        point.add(new Point(2, 4));
        expect(point.xy).toEqual([6, 10]);

        point.add([-2, -4]);
        expect(point.xy).toEqual([4, 6]);
    });

    it('Point math: subtract', () => {
        let point: Point = new Point(10, 20);

        point.subtract(1);
        expect(point.xy).toEqual([9, 19]);

        point.subtract(2, 3);
        expect(point.xy).toEqual([7, 16]);

        point.subtract(new Point(2, 4));
        expect(point.xy).toEqual([5, 12]);

        point.subtract([-2, -4]);
        expect(point.xy).toEqual([7, 16]);
    });

    it('Point math: multiply', () => {
        let point: Point = new Point(2, 3);

        point.multiply(2);
        expect(point.xy).toEqual([4, 6]);

        point.multiply(3, 2);
        expect(point.xy).toEqual([12, 12]);

        point.multiply(new Point(2, 4));
        expect(point.xy).toEqual([24, 48]);

        point.multiply([-0.5, -0.25]);
        expect(point.xy).toEqual([-12, -12]);
    });

    it('Point math: divide', () => {
        let point: Point = new Point(20, 40);

        point.divide(2);
        expect(point.xy).toEqual([10, 20]);

        point.divide(2, 4);
        expect(point.xy).toEqual([5, 5]);

        point.divide(new Point(2, 5));
        expect(point.xy).toEqual([2.5, 1]);

        point.divide([-0.5, -0.25]);
        expect(point.xy).toEqual([-5, -4]);
    });

    it('Point math: rounding', () => {
        expect(new Point(13, 17).divide(3).round().xy).toEqual([4, 6]);

        expect(new Point(13, 17).divide(3).floor().xy).toEqual([4, 5]);

        expect(new Point(13, 17).divide(3).ceil().xy).toEqual([5, 6]);
    });

    it('Point clone', () => {
        expect(new Point(2, 3).clone().xy).toEqual([2, 3]);

        let point: Point = new Point(2, 3);

        expect(point).not.toBe(point.clone());
    });

    it('Point distanceTo', () => {
        expect(new Point(1, 1).distanceTo(new Point(9, 7))).toBe(10);
    });
});
