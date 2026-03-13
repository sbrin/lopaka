import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {ArduinoGFXPlatform} from './arduinogfx';
import {PolygonLayer} from '../core/layers/polygon.layer';

describe('Arduino GFX platform', () => {
    it('generating source code', () => {
        const platform = new ArduinoGFXPlatform();
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
    it('normalizes polygon helper names to valid C and C++ identifiers', () => {
        const platform = new ArduinoGFXPlatform();
        const polygon = layersMock.find((layer) => layer instanceof PolygonLayer) as PolygonLayer;
        const originalName = polygon.name;
        polygon.name = 'Polygon 01-test';

        const source = platform.generateSourceCode([polygon]);
        polygon.name = originalName;

        expect(source).toContain('void draw_Polygon_01_test(void)');
        expect(source).toContain('draw_Polygon_01_test();');
    });
});
