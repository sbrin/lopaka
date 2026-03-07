import {describe, expect, it} from 'vitest';
import {Point} from './point';
import {Rect} from './rect';

describe('Point class', () => {
    describe('constructors', () => {
        it('should create point with default values (0,0)', () => {
            const point = new Point();
            expect(point.x).toBe(0);
            expect(point.y).toBe(0);
        });

        it('should create point with single value for both coordinates', () => {
            const point = new Point(5);
            expect(point.x).toBe(5);
            expect(point.y).toBe(5);
        });

        it('should create point from array', () => {
            const point = new Point([3, 7]);
            expect(point.x).toBe(3);
            expect(point.y).toBe(7);
        });

        it('should create point from x,y coordinates', () => {
            const point = new Point(2, 8);
            expect(point.x).toBe(2);
            expect(point.y).toBe(8);
        });

        it('should create point from another Point', () => {
            const original = new Point(4, 6);
            const copy = new Point(original);
            expect(copy.x).toBe(4);
            expect(copy.y).toBe(6);
            expect(copy).not.toBe(original); // Should be different instances
        });
    });

    describe('getters and setters', () => {
        it('should get and set x coordinate', () => {
            const point = new Point();
            point.x = 10;
            expect(point.x).toBe(10);
        });

        it('should get and set y coordinate', () => {
            const point = new Point();
            point.y = 20;
            expect(point.y).toBe(20);
        });

        it('should get xy as array', () => {
            const point = new Point(5, 10);
            expect(point.xy).toEqual([5, 10]);
        });

        it('should set xy from array', () => {
            const point = new Point();
            point.xy = [15, 25];
            expect(point.x).toBe(15);
            expect(point.y).toBe(25);
        });
    });

    describe('mathematical operations', () => {
        describe('add', () => {
            it.each([
                {input: 3, expected: [4, 5], name: 'single value'},
                {input: [3, 4], expected: [4, 6], name: 'array'},
                {input: new Point(3, 4), expected: [4, 6], name: 'Point object'},
            ])('should add $name to point', ({input, expected}) => {
                const point = new Point(1, 2);
                point.add(input as any);
                expect(point.xy).toEqual(expected);
            });

            it('should add x,y values', () => {
                const point = new Point(1, 2);
                point.add(3, 4);
                expect(point.xy).toEqual([4, 6]);
            });
        });

        describe('subtract', () => {
            it.each([
                {input: 2, expected: [3, 5], name: 'single value'},
                {input: [2, 3], expected: [3, 4], name: 'array'},
                {input: new Point(2, 3), expected: [3, 4], name: 'Point object'},
            ])('should subtract $name from point', ({input, expected}) => {
                const point = new Point(5, 7);
                point.subtract(input as any);
                expect(point.xy).toEqual(expected);
            });

            it('should subtract x,y values', () => {
                const point = new Point(5, 7);
                point.subtract(2, 3);
                expect(point.xy).toEqual([3, 4]);
            });
        });

        describe('multiply', () => {
            it.each([
                {input: 4, expected: [8, 12], name: 'single value'},
                {input: [4, 5], expected: [8, 15], name: 'array'},
                {input: new Point(4, 5), expected: [8, 15], name: 'Point object'},
            ])('should multiply point by $name', ({input, expected}) => {
                const point = new Point(2, 3);
                point.multiply(input as any);
                expect(point.xy).toEqual(expected);
            });

            it('should multiply by x,y values', () => {
                const point = new Point(2, 3);
                point.multiply(4, 5);
                expect(point.xy).toEqual([8, 15]);
            });
        });

        describe('divide', () => {
            it.each([
                {input: 4, expected: [2, 3.75], name: 'single value'},
                {input: [4, 5], expected: [2, 3], name: 'array'},
                {input: new Point(4, 5), expected: [2, 3], name: 'Point object'},
            ])('should divide point by $name', ({input, expected}) => {
                const point = new Point(8, 15);
                point.divide(input as any);
                expect(point.xy).toEqual(expected);
            });

            it('should divide by x,y values', () => {
                const point = new Point(8, 15);
                point.divide(4, 5);
                expect(point.xy).toEqual([2, 3]);
            });
        });
    });

    describe('utility methods', () => {
        it('should calculate min point', () => {
            const point1 = new Point(5, 10);
            const point2 = new Point(3, 15);
            const min = point1.min(point2);
            expect(min.xy).toEqual([3, 10]);
        });

        it('should calculate max point', () => {
            const point1 = new Point(5, 10);
            const point2 = new Point(3, 15);
            const max = point1.max(point2);
            expect(max.xy).toEqual([5, 15]);
        });

        it('should calculate absolute values', () => {
            const point = new Point(-5, -10);
            point.abs();
            expect(point.xy).toEqual([5, 10]);
        });

        it('should clone point', () => {
            const original = new Point(5, 10);
            const clone = original.clone();
            expect(clone.xy).toEqual([5, 10]);
            expect(clone).not.toBe(original);
        });

        it('should round coordinates', () => {
            const point = new Point(5.7, 10.3);
            point.round();
            expect(point.xy).toEqual([6, 10]);
        });

        it('should floor coordinates', () => {
            const point = new Point(5.7, 10.8);
            point.floor();
            expect(point.xy).toEqual([5, 10]);
        });

        it('should ceil coordinates', () => {
            const point = new Point(5.2, 10.1);
            point.ceil();
            expect(point.xy).toEqual([6, 11]);
        });

        it('should swap coordinates', () => {
            const point = new Point(5, 10);
            point.swap();
            expect(point.xy).toEqual([10, 5]);
        });

        it('should get sign of coordinates', () => {
            const point = new Point(-5, 10);
            const sign = point.sign();
            expect(sign).toEqual([-1, 1]);
        });

        it('should calculate distance to another point', () => {
            const point1 = new Point(0, 0);
            const point2 = new Point(3, 4);
            const distance = point1.distanceTo(point2);
            expect(distance).toBe(5); // 3-4-5 triangle
        });

        it('should normalize point', () => {
            const point = new Point(3, 4);
            const normalized = point.normalize();
            expect(normalized.x).toBeCloseTo(0.6);
            expect(normalized.y).toBeCloseTo(0.8);
        });

        it('should bound point to rectangle', () => {
            const point = new Point(15, 25);
            const rect = new Rect(0, 0, 10, 20);
            point.boundTo(rect);
            expect(point.xy).toEqual([10, 20]);
        });

        it('should check equality with another point', () => {
            const point1 = new Point(5, 10);
            const point2 = new Point(5, 10);
            const point3 = new Point(10, 5);
            expect(point1.equals(point2)).toBe(true);
            expect(point1.equals(point3)).toBe(false);
        });

        it('should pack and unpack point', () => {
            const point = new Point(5, 10);
            const packed = point.pack();
            expect(packed).toEqual([5, 10]);
            const unpacked = Point.unpack(packed);
            expect(unpacked.equals(point)).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle zero values', () => {
            const point = new Point(0, 0);
            expect(point.xy).toEqual([0, 0]);
        });

        it('should handle negative values', () => {
            const point = new Point(-5, -10);
            expect(point.xy).toEqual([-5, -10]);
        });

        it('should handle decimal values', () => {
            const point = new Point(5.5, 10.7);
            expect(point.xy).toEqual([5.5, 10.7]);
        });

        it('should handle operations that return this', () => {
            const point = new Point(5, 10);
            const result = point.add(2);
            expect(result).toBe(point); // Should return same instance
        });
    });
});
