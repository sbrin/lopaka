import { describe, expect, it } from 'vitest';
import { layersMock } from './layers.mock';
import { EmbeddedGraphicsPlatform } from './embedded-graphics';
import { PolygonLayer } from '../core/layers/polygon.layer';

describe('embedded-graphics platform', () => {
    it('generates Rust embedded-graphics source code', () => {
        const platform = new EmbeddedGraphicsPlatform();

        expect(platform.generateSourceCode(layersMock, undefined, 'ui')).toMatchSnapshot();
    });

    it('strips source-map markers from the parsed code shown in the UI', () => {
        const platform = new EmbeddedGraphicsPlatform();

        const parsed = platform.sourceMapParser.parse(platform.generateSourceCode(layersMock, undefined, 'ui'));

        expect(parsed.code).not.toMatch(/^@\w+;/m);
        expect(parsed.code).toContain('    Rectangle::new(');
        expect(parsed.code).toContain('    draw_polygon_abc123polygon(display)?;');
    });

    it('normalizes polygon helper names to valid Rust identifiers', () => {
        const platform = new EmbeddedGraphicsPlatform();
        const polygon = layersMock.find((layer) => layer instanceof PolygonLayer) as PolygonLayer;
        const originalName = polygon.name;
        polygon.name = 'Polygon 01-test';

        const source = platform.generateSourceCode([polygon], undefined, 'ui');
        polygon.name = originalName;

        expect(source).toContain('fn draw_Polygon_01_test<D: DrawTarget<Color = BinaryColor>>(');
        expect(source).toContain('draw_Polygon_01_test(display)?;');
        expect(source).toContain('fn draw_ui<D: DrawTarget<Color = BinaryColor>>(');
    });
});