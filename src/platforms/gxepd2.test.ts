import {describe, expect, it} from 'vitest';
import {CircleLayer} from '../core/layers/circle.layer';
import {Point} from '../core/point';
import {GxEPD2Platform} from './gxepd2';
import {layersMock} from './layers.mock';

describe('GxEPD2 platform', () => {
    it('imports a generated 20x20 circle with the original radius and position', () => {
        const platform = new GxEPD2Platform();
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
