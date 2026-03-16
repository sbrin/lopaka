import {describe, expect, it} from 'vitest';
import platforms, {getTemplates} from './platforms';

describe('Platforms', () => {
    it('should have platform registry structure', () => {
        // Test that the platforms object has the expected structure and contains specific platforms.
        expect(platforms).toBeTypeOf('object');
        expect(platforms['u8g2']).toBeDefined();
        expect(platforms['adafruit_gfx']).toBeDefined();
    });
    it('should return templates for a given platform', () => {
        // Test the getTemplates function to ensure it returns the correct templates for a given platform.
        const u8g2Templates = getTemplates('u8g2');
        expect(Array.isArray(u8g2Templates)).toBe(true);
        expect(u8g2Templates).toEqual(['arduino', 'esp-idf']);

        const adafruitTemplates = getTemplates('adafruit_gfx');
        expect(Array.isArray(adafruitTemplates)).toBe(true);
        expect(adafruitTemplates).toEqual(['Default']);
    });

    it('should throw an error for a non-existent platform', () => {
        // Test that getTemplates throws an error when a non-existent platform is requested.
        expect(() => getTemplates('non-existent-platform')).toThrow();
    });
});
