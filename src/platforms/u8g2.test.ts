import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {U8g2Platform} from './u8g2';
import {PolygonLayer} from '../core/layers/polygon.layer';

describe('U8g2 platform', () => {
    it('generating source code: Arduino (Cpp) Progmem', () => {
        const platform = new U8g2Platform();
        platform.setTemplate('arduino');
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
    it('generating source code: Arduino (Cpp)', () => {
        const platform = new U8g2Platform();
        platform.setTemplate('arduino');
        platform.getTemplates().arduino.settings.progmem = false;
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
    it('generating source code: Esp-Idf (C)', () => {
        const platform = new U8g2Platform();
        platform.setTemplate('esp-idf');
        platform.getTemplates().arduino.settings = {};
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
    it('normalizes polygon helper names to valid C and C++ identifiers', () => {
        const platform = new U8g2Platform();
        const polygon = layersMock.find((layer) => layer instanceof PolygonLayer) as PolygonLayer;
        const originalName = polygon.name;
        polygon.name = 'Polygon 01-test';

        const source = platform.generateSourceCode([polygon]);
        polygon.name = originalName;

        expect(source).toContain('void draw_Polygon_01_test(void)');
        expect(source).toContain('draw_Polygon_01_test();');
    });
    describe('Additional U8g2Platform tests', () => {
        it('should initialize U8g2 specific features', () => {
            const platform = new U8g2Platform();

            expect(platform.features.hasInvertedColors).toBe(true);
            expect(platform.features.defaultColor).toBe('#FFFFFF');
            expect(platform.features.screenBgColor).toBe('#000000');
        });

        it('should pack black color as 0', () => {
            const platform = new U8g2Platform();

            expect(platform.packColor('#000000')).toBe('0');
        });

        it('should pack 0xFFFF color as 0', () => {
            const platform = new U8g2Platform();

            expect(platform.packColor('0xFFFF')).toBe('0');
        });

        it('should contain arduino template', () => {
            const platform = new U8g2Platform();

            expect(platform.getTemplates()).toHaveProperty('arduino');
        });

        it('should contain esp-idf template', () => {
            const platform = new U8g2Platform();

            expect(platform.getTemplates()).toHaveProperty('esp-idf');
        });

        it('should generate source code for unsorted layers', () => {
            const platform = new U8g2Platform();

            const layers = [...layersMock];

            if (layers.length >= 2) {
                layers[0].index = 100;
                layers[1].index = 1;
            }

            const source = platform.generateSourceCode(layers);

            expect(source).toBeTruthy();
            expect(source.length).toBeGreaterThan(0);
        });
    });
});
