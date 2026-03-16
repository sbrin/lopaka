import {describe, expect, it} from 'vitest';
import displays, {Display} from './displays';
import {Point} from './point';

describe('Displays', () => {
    it('should export an array of display configurations', () => {
        expect(Array.isArray(displays)).toBe(true);
        expect(displays.length).toBeGreaterThan(0);
    });

    it('should have displays with title and size properties', () => {
        displays.forEach((display: Display) => {
            expect(display).toHaveProperty('title');
            expect(display).toHaveProperty('size');
            expect(typeof display.title).toBe('string');
            expect(display.size).toBeInstanceOf(Point);
        });
    });

    it('should contain expected common display sizes', () => {
        const displayTitles = displays.map((d) => d.title);

        expect(displayTitles).toContain('128×64');
        expect(displayTitles).toContain('128×32');
        expect(displayTitles).toContain('96×96');
        expect(displayTitles).toContain('240×240');
    });

    it('should have valid point dimensions for each display', () => {
        displays.forEach((display: Display) => {
            expect(display.size.x).toBeGreaterThan(0);
            expect(display.size.y).toBeGreaterThan(0);
            expect(Number.isInteger(display.size.x)).toBe(true);
            expect(Number.isInteger(display.size.y)).toBe(true);
        });
    });

    it('should have unique display titles', () => {
        const titles = displays.map((d) => d.title);
        const uniqueTitles = [...new Set(titles)];
        expect(titles.length).toBe(uniqueTitles.length);
    });

    it('should have dimensions in title match Point object', () => {
        displays.forEach((display: Display) => {
            const match = display.title.match(/(\d+)×(\d+)/);
            expect(match).not.toBeNull();
            const [, width, height] = match!;
            expect(parseInt(width, 10)).toBe(display.size.x);
            expect(parseInt(height, 10)).toBe(display.size.y);
        });
    });
});
