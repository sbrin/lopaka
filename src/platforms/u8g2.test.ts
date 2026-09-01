import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {U8g2Platform} from './u8g2';
import {PolygonLayer} from '../core/layers/polygon.layer';
import {CircleLayer} from '../core/layers/circle.layer';
import {Point} from '../core/point';
import {RectangleLayer} from '../core/layers/rectangle.layer';

function createRect(features: TPlatformFeatures, uid: string, color: string, index: number): RectangleLayer {
    const layer = new RectangleLayer(features);
    layer.state = {t: 'rect', n: uid, c: color, f: true, i: index, p: [index * 10, 0], u: uid, s: [8, 8]};
    return layer;
}

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
    it('emits setDrawColor only when the draw color changes between layers (Arduino)', () => {
        const platform = new U8g2Platform();
        platform.setTemplate('arduino');
        platform.setTemplateSetting('comments', false);
        platform.setTemplateSetting('wrap', false);
        const source = platform.generateSourceCode([
            createRect(platform.features, 'black', '#000000', 0),
            createRect(platform.features, 'white', '#ffffff', 1),
        ]);

        expect(source).toMatch(/u8g2\.setDrawColor\(0\);\s*@black;u8g2\.drawBox/);
        expect(source).toMatch(/u8g2\.setDrawColor\(1\);\s*@white;u8g2\.drawBox/);
    });
    it('emits setDrawColor only when the draw color changes between layers (ESP-IDF)', () => {
        const platform = new U8g2Platform();
        platform.setTemplate('esp-idf');
        platform.setTemplateSetting('comments', false);
        platform.setTemplateSetting('wrap', false);
        const source = platform.generateSourceCode([
            createRect(platform.features, 'black', '#000000', 0),
            createRect(platform.features, 'white', '#ffffff', 1),
        ]);

        expect(source).toMatch(/u8g2_SetDrawColor\(&u8g2, 0\);\s*@black;u8g2_DrawBox/);
        expect(source).toMatch(/u8g2_SetDrawColor\(&u8g2, 1\);\s*@white;u8g2_DrawBox/);
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

    it('imports a generated circle without falling through into an ellipse', () => {
        const platform = new U8g2Platform();
        const circle = layersMock.find((layer) => layer instanceof CircleLayer) as CircleLayer;
        const originalPosition = circle.position.clone();
        const originalRadius = circle.radius;
        circle.position = new Point(10, 10);
        circle.radius = 10;

        const source = platform.sourceMapParser.parse(platform.generateSourceCode([circle])).code;
        const {states, warnings} = platform.importSourceCode(source);
        circle.position = originalPosition;
        circle.radius = originalRadius;

        expect(warnings).toEqual([]);
        expect(states).toHaveLength(1);
        expect(states[0].type).toBe('circle');
        expect(states[0].position.xy).toEqual([10, 10]);
        expect(states[0].radius).toBe(10);
    });
});
