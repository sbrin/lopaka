import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {FlipperPlatform} from './flipper';
import {PolygonLayer} from '../core/layers/polygon.layer';
import {CircleLayer} from '../core/layers/circle.layer';
import {Point} from '../core/point';

describe('Flipper zero platform', () => {
    it('generating source code', () => {
        const platform = new FlipperPlatform();
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
    it('normalizes polygon helper names to valid C and C++ identifiers', () => {
        const platform = new FlipperPlatform();
        const polygon = layersMock.find((layer) => layer instanceof PolygonLayer) as PolygonLayer;
        const originalName = polygon.name;
        polygon.name = 'Polygon 01-test';

        const source = platform.generateSourceCode([polygon]);
        polygon.name = originalName;

        expect(source).toContain('void draw_Polygon_01_test(Canvas* canvas)');
        expect(source).toContain('draw_Polygon_01_test(canvas);');
    });

    it('imports a generated 20x20 circle with the original radius and position', () => {
        const platform = new FlipperPlatform();
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
