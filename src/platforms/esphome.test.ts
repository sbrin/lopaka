import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {EsphomePlatform} from './esphome';
import {CircleLayer} from '../core/layers/circle.layer';
import {Point} from '../core/point';

describe('EsphomePlatform', () => {
    it('has id', () => {
        expect(EsphomePlatform.id).toBe('esphome');
    });

    it('generating source code', () => {
        const platform = new EsphomePlatform();
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });

    it('imports a generated 20x20 circle with the original radius and position', () => {
        const platform = new EsphomePlatform();
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
        expect(states[0].position).toEqual([10, 10]);
        expect(states[0].radius).toBe(10);
    });
});
