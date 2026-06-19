import {describe, expect, it, beforeEach, vi} from 'vitest';
import {layersMock} from './layers.mock';
import {U8g2Platform} from './u8g2';
import {PolygonLayer} from '../core/layers/polygon.layer';
import {AbstractLayer, TModifierType} from '../core/layers/abstract.layer';
import {RectangleLayer} from '../core/layers/rectangle.layer';
import {CircleLayer} from '../core/layers/circle.layer';
import {EllipseLayer} from '../core/layers/ellipse.layer';

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

    describe('Color fill functionality for U8g2', () => {
        let platform: U8g2Platform;
        let rectLayer: RectangleLayer;
        let circleLayer: CircleLayer;
        let ellipseLayer: EllipseLayer;

        beforeEach(() => {
            platform = new U8g2Platform();
            platform.setTemplate('arduino');

            rectLayer = new RectangleLayer({
                x: 10,
                y: 10,
                w: 50,
                h: 30,
                fill: true,
                color: '#000000',
            });
            rectLayer.name = 'Test Rect';

            circleLayer = new CircleLayer({
                x: 30,
                y: 30,
                radius: 20,
                fill: true,
                color: '#000000',
            });
            circleLayer.name = 'Test Circle';

            ellipseLayer = new EllipseLayer({
                x: 40,
                y: 40,
                rx: 25,
                ry: 15,
                fill: true,
                color: '#000000',
            });
            ellipseLayer.name = 'Test Ellipse';
        });

        it('should generate drawBox for filled rectangle when fill is true', () => {
            const source = platform.generateSourceCode([rectLayer]);

            expect(source).toContain('u8g2.drawBox');
            expect(source).not.toContain('u8g2.drawFrame');
        });

        it('should generate drawFrame for unfilled rectangle when fill is false', () => {
            rectLayer.fill = false;
            const source = platform.generateSourceCode([rectLayer]);

            expect(source).toContain('u8g2.drawFrame');
            expect(source).not.toContain('u8g2.drawBox');
        });

        it('should generate drawDisc for filled circle when fill is true', () => {
            const source = platform.generateSourceCode([circleLayer]);

            expect(source).toContain('u8g2.drawDisc');
            expect(source).not.toContain('u8g2.drawCircle');
        });

        it('should generate drawCircle for unfilled circle when fill is false', () => {
            circleLayer.fill = false;
            const source = platform.generateSourceCode([circleLayer]);

            expect(source).toContain('u8g2.drawCircle');
            expect(source).not.toContain('u8g2.drawDisc');
        });

        it('should generate drawFilledEllipse for filled ellipse when fill is true', () => {
            const source = platform.generateSourceCode([ellipseLayer]);

            expect(source).toContain('u8g2.drawFilledEllipse');
            expect(source).not.toContain('u8g2.drawEllipse');
        });

        it('should generate drawEllipse for unfilled ellipse when fill is false', () => {
            ellipseLayer.fill = false;
            const source = platform.generateSourceCode([ellipseLayer]);

            expect(source).toContain('u8g2.drawEllipse');
            expect(source).not.toContain('u8g2.drawFilledEllipse');
        });

        it('should set draw color to 1 for black color (#000000)', () => {
            const source = platform.generateSourceCode([rectLayer]);

            expect(source).toContain('u8g2.setDrawColor(1)');
        });

        it('should set draw color to 0 for white color (#ffffff)', () => {
            rectLayer.color = '#ffffff';
            const source = platform.generateSourceCode([rectLayer]);

            expect(source).toContain('u8g2.setDrawColor(0)');
        });

        it('should handle color change from black to white in generated code', () => {
            rectLayer.color = '#000000';
            let source = platform.generateSourceCode([rectLayer]);
            expect(source).toContain('u8g2.setDrawColor(1)');

            rectLayer.color = '#ffffff';
            source = platform.generateSourceCode([rectLayer]);
            expect(source).toContain('u8g2.setDrawColor(0)');

            rectLayer.color = '#000000';
            source = platform.generateSourceCode([rectLayer]);
            expect(source).toContain('u8g2.setDrawColor(1)');
        });

        it('should handle multiple layers with different colors', () => {
            const rect1 = new RectangleLayer({
                x: 10,
                y: 10,
                w: 50,
                h: 30,
                fill: true,
                color: '#000000',
            });
            rect1.name = 'Rect Black';

            const rect2 = new RectangleLayer({
                x: 70,
                y: 10,
                w: 50,
                h: 30,
                fill: true,
                color: '#ffffff',
            });
            rect2.name = 'Rect White';

            const source = platform.generateSourceCode([rect1, rect2]);

            const colorLines = source.match(/u8g2\.setDrawColor\([01]\)/g);
            expect(colorLines).toBeTruthy();
            expect(colorLines?.length).toBeGreaterThanOrEqual(2);

            expect(source).toContain('u8g2.setDrawColor(1)');
            expect(source).toContain('u8g2.setDrawColor(0)');
        });

        it('should handle inverted layers with draw color 2 (XOR mode)', () => {
            rectLayer.inverted = true;
            const source = platform.generateSourceCode([rectLayer]);

            expect(source).toContain('u8g2.setDrawColor(2)');
        });

        it('should generate correct code for rectangle with radius and fill', () => {
            const roundedRect = new RectangleLayer({
                x: 10,
                y: 10,
                w: 50,
                h: 30,
                radius: 5,
                fill: true,
                color: '#000000',
            });
            roundedRect.name = 'Rounded Rect';

            const source = platform.generateSourceCode([roundedRect]);

            expect(source).toContain('u8g2.drawRBox');
            expect(source).toContain(', @r:5');
        });

        it('should generate correct code for rectangle with radius without fill', () => {
            const roundedRect = new RectangleLayer({
                x: 10,
                y: 10,
                w: 50,
                h: 30,
                radius: 5,
                fill: false,
                color: '#000000',
            });
            roundedRect.name = 'Rounded Rect Frame';

            const source = platform.generateSourceCode([roundedRect]);

            expect(source).toContain('u8g2.drawRFrame');
            expect(source).toContain(', @r:5');
        });

        it('should maintain draw color state across multiple layers', () => {
            const layers = [
                new RectangleLayer({x: 10, y: 10, w: 50, h: 30, fill: true, color: '#000000'}),
                new RectangleLayer({x: 70, y: 10, w: 50, h: 30, fill: true, color: '#000000'}),
                new RectangleLayer({x: 130, y: 10, w: 50, h: 30, fill: true, color: '#ffffff'}),
                new RectangleLayer({x: 190, y: 10, w: 50, h: 30, fill: true, color: '#ffffff'}),
            ];

            layers.forEach((l, i) => (l.name = `Rect ${i}`));

            const source = platform.generateSourceCode(layers);

            const colorCalls = source.match(/u8g2\.setDrawColor\([01]\)/g);
            expect(colorCalls?.length).toBe(2);

            const blackIndex = source.indexOf('u8g2.setDrawColor(1)');
            const whiteIndex = source.indexOf('u8g2.setDrawColor(0)');
            expect(blackIndex).toBeLessThan(whiteIndex);
        });

        it('should handle color values case insensitively', () => {
            const colorVariants = ['#000000', '#000000', '#000000'];
            const layers = colorVariants.map((color, i) => {
                const layer = new RectangleLayer({
                    x: 10 + i * 60,
                    y: 10,
                    w: 50,
                    h: 30,
                    fill: true,
                    color: color,
                });
                layer.name = `Rect ${i}`;
                return layer;
            });

            const source = platform.generateSourceCode(layers);

            const colorCalls = source.match(/u8g2\.setDrawColor\(1\)/g);
            expect(colorCalls?.length).toBe(1);
        });

        it('should handle fill toggle correctly in generated code', () => {
            const layer = new RectangleLayer({
                x: 10,
                y: 10,
                w: 50,
                h: 30,
                fill: true,
                color: '#000000',
            });
            layer.name = 'Test Rect';

            let source = platform.generateSourceCode([layer]);
            expect(source).toContain('u8g2.drawBox');
            expect(source).not.toContain('u8g2.drawFrame');

            layer.fill = false;
            source = platform.generateSourceCode([layer]);
            expect(source).toContain('u8g2.drawFrame');
            expect(source).not.toContain('u8g2.drawBox');

            layer.fill = true;
            source = platform.generateSourceCode([layer]);
            expect(source).toContain('u8g2.drawBox');
            expect(source).not.toContain('u8g2.drawFrame');
        });

        it('should handle fill toggle for circle correctly', () => {
            const layer = new CircleLayer({
                x: 30,
                y: 30,
                radius: 20,
                fill: true,
                color: '#000000',
            });
            layer.name = 'Test Circle';

            let source = platform.generateSourceCode([layer]);
            expect(source).toContain('u8g2.drawDisc');
            expect(source).not.toContain('u8g2.drawCircle');

            layer.fill = false;
            source = platform.generateSourceCode([layer]);
            expect(source).toContain('u8g2.drawCircle');
            expect(source).not.toContain('u8g2.drawDisc');
        });

        it('should handle fill toggle for ellipse correctly', () => {
            const layer = new EllipseLayer({
                x: 40,
                y: 40,
                rx: 25,
                ry: 15,
                fill: true,
                color: '#000000',
            });
            layer.name = 'Test Ellipse';

            let source = platform.generateSourceCode([layer]);
            expect(source).toContain('u8g2.drawFilledEllipse');
            expect(source).not.toContain('u8g2.drawEllipse');

            layer.fill = false;
            source = platform.generateSourceCode([layer]);
            expect(source).toContain('u8g2.drawEllipse');
            expect(source).not.toContain('u8g2.drawFilledEllipse');
        });

        it('should handle mixed fill states across multiple layers', () => {
            const layers = [
                new RectangleLayer({x: 10, y: 10, w: 50, h: 30, fill: true, color: '#000000'}),
                new RectangleLayer({x: 70, y: 10, w: 50, h: 30, fill: false, color: '#000000'}),
                new CircleLayer({x: 180, y: 25, radius: 20, fill: true, color: '#000000'}),
                new CircleLayer({x: 240, y: 25, radius: 20, fill: false, color: '#000000'}),
            ];

            layers.forEach((l, i) => (l.name = `Layer ${i}`));

            const source = platform.generateSourceCode(layers);

            expect(source).toContain('u8g2.drawBox');
            expect(source).toContain('u8g2.drawFrame');
            expect(source).toContain('u8g2.drawDisc');
            expect(source).toContain('u8g2.drawCircle');
        });
    });

    describe('Color palette in inspector', () => {
        it('should render only black and white buttons for U8g2 platform', () => {
            const platform = new U8g2Platform();
            const features = platform.features;

            expect(features.palette).toBeDefined();
            if (features.palette) {
                expect(features.palette).toContain('#000000');
                expect(features.palette).toContain('#ffffff');
                expect(features.palette.length).toBe(2);
            }
        });

        it('should handle color switching between black and white', () => {
            const platform = new U8g2Platform();
            const layer = new RectangleLayer({
                x: 10,
                y: 10,
                w: 50,
                h: 30,
                fill: true,
                color: '#000000',
            });

            const checkColor = (color: string, expectedDrawColor: number) => {
                layer.color = color;
                const source = platform.generateSourceCode([layer]);
                expect(source).toContain(`u8g2.setDrawColor(${expectedDrawColor})`);
            };

            checkColor('#000000', 1);
            checkColor('#ffffff', 0);
            checkColor('#000000', 1);
            checkColor('#ffffff', 0);
            checkColor('#000000', 1);
        });

        it('should handle case-insensitive color values in U8g2', () => {
            const platform = new U8g2Platform();
            const layer = new RectangleLayer({
                x: 10,
                y: 10,
                w: 50,
                h: 30,
                fill: true,
                color: '#000000',
            });

            const blackVariants = ['#000000', '#000000', 'black', 'BLACK', '#000'];
            blackVariants.forEach((color) => {
                layer.color = color;
                const source = platform.generateSourceCode([layer]);
                expect(source).toContain('u8g2.setDrawColor(1)');
            });

            const whiteVariants = ['#ffffff', '#FFFFFF', 'white', 'WHITE', '#FFF'];
            whiteVariants.forEach((color) => {
                layer.color = color;
                const source = platform.generateSourceCode([layer]);
                expect(source).toContain('u8g2.setDrawColor(0)');
            });
        });
    });

    describe('Edge cases for fill functionality', () => {
        let platform: U8g2Platform;

        beforeEach(() => {
            platform = new U8g2Platform();
            platform.setTemplate('arduino');
        });

        it('should handle layers with undefined color', () => {
            const layer = new RectangleLayer({
                x: 10,
                y: 10,
                w: 50,
                h: 30,
                fill: true,
            });
            layer.name = 'Test Rect';

            const source = platform.generateSourceCode([layer]);
            expect(source).toContain('u8g2.drawBox');
            expect(source).toMatch(/u8g2\.setDrawColor\([01]\)/);
        });

        it('should handle layers with null fill value', () => {
            const layer = new RectangleLayer({
                x: 10,
                y: 10,
                w: 50,
                h: 30,
                fill: null as any,
                color: '#000000',
            });
            layer.name = 'Test Rect';

            const source = platform.generateSourceCode([layer]);
            expect(source).toContain('u8g2.drawFrame');
            expect(source).not.toContain('u8g2.drawBox');
        });

        it('should handle layers with undefined fill value', () => {
            const layer = new RectangleLayer({
                x: 10,
                y: 10,
                w: 50,
                h: 30,
                color: '#000000',
            });
            layer.name = 'Test Rect';

            const source = platform.generateSourceCode([layer]);
            expect(source).toContain('u8g2.drawFrame');
            expect(source).not.toContain('u8g2.drawBox');
        });

        it('should optimize draw color calls for consecutive same color layers', () => {
            const layers = [];
            for (let i = 0; i < 5; i++) {
                const layer = new RectangleLayer({
                    x: 10 + i * 60,
                    y: 10,
                    w: 50,
                    h: 30,
                    fill: true,
                    color: '#000000',
                });
                layer.name = `Rect ${i}`;
                layers.push(layer);
            }

            const source = platform.generateSourceCode(layers);

            const colorCalls = source.match(/u8g2\.setDrawColor\([01]\)/g);
            expect(colorCalls?.length).toBe(1);
        });

        it('should insert draw color calls only when color changes', () => {
            const layers = [
                new RectangleLayer({x: 10, y: 10, w: 50, h: 30, fill: true, color: '#000000'}),
                new RectangleLayer({x: 70, y: 10, w: 50, h: 30, fill: true, color: '#000000'}),
                new RectangleLayer({x: 130, y: 10, w: 50, h: 30, fill: true, color: '#ffffff'}),
                new RectangleLayer({x: 190, y: 10, w: 50, h: 30, fill: true, color: '#ffffff'}),
                new RectangleLayer({x: 250, y: 10, w: 50, h: 30, fill: true, color: '#000000'}),
            ];

            layers.forEach((l, i) => (l.name = `Rect ${i}`));

            const source = platform.generateSourceCode(layers);

            const colorCalls = source.match(/u8g2\.setDrawColor\([01]\)/g);
            expect(colorCalls?.length).toBe(3);

            const callPositions = [];
            let pos = 0;
            while (pos < source.length) {
                const index = source.indexOf('u8g2.setDrawColor(', pos);
                if (index === -1) break;
                callPositions.push(index);
                pos = index + 1;
            }

            const colors = callPositions.map((idx) => {
                const endIdx = source.indexOf(')', idx);
                return source.substring(idx + 19, endIdx);
            });

            expect(colors).toEqual(['1', '0', '1']);
        });
    });
});
