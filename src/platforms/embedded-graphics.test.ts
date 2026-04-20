import { describe, expect, it } from 'vitest';
import { layersMock } from './layers.mock';
import { IconLayer } from '../core/layers/icon.layer';
import { Point } from '../core/point';
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
        expect(parsed.code).toContain('fn draw_ui<D: DrawTarget<Color = BinaryColor>>(');
        expect(parsed.code).toContain('    draw_polygon_abc123polygon(display)?;');
        expect(parsed.code).toContain('    &ImageRaw::new_binary(');
    });

    it('exports icon layers as embedded-graphics raw images', () => {
        const platform = new EmbeddedGraphicsPlatform();
        const icon = new IconLayer(platform.features);
        const pixels = new Uint8ClampedArray(8 * 8 * 4);
        pixels[3] = 255;

        icon.name = 'Icon';
        icon.position = new Point(4, 6);
        icon.size = new Point(8, 8);
        icon.data = new ImageData(pixels, 8, 8);

        const source = platform.generateSourceCode([icon], undefined, 'ui');

        expect(source).toContain('static image_Icon_bits: &[u8] = &[');
        expect(source).toContain('fn draw_Icon<D: DrawTarget<Color = BinaryColor>>(');
        expect(source).toContain('&ImageRaw::new_binary(image_Icon_bits, 8)');
        expect(source).toContain('Point::new(4, 6)');
        expect(source).toContain('draw_Icon(display)?;');
    });

    it('can wrap the generated code in a preview window entrypoint', () => {
        const platform = new EmbeddedGraphicsPlatform();
        const ctx = {
            canvas: {
                width: 240,
                height: 135,
            },
        } as OffscreenCanvasRenderingContext2D;

        platform.setTemplateSetting('preview_window', true);

        const source = platform.generateSourceCode(layersMock, ctx, 'preview demo');

        expect(source).toContain('use embedded_graphics_simulator::{BinaryColorTheme, OutputSettingsBuilder, SimulatorDisplay, Window};');
        expect(source).toContain('fn draw_preview_demo<D: DrawTarget<Color = BinaryColor>>(');
        expect(source).toContain('fn main() -> Result<(), core::convert::Infallible> {');
        expect(source).toContain('SimulatorDisplay::<BinaryColor>::new(Size::new(240, 135));');
        expect(source).toContain('Window::new("preview demo", &output_settings).show_static(&display);');
        expect(source).toContain('draw_preview_demo(&mut display)?;');
    });

    it('respects disabling the wrapper function when preview window is off', () => {
        const platform = new EmbeddedGraphicsPlatform();

        platform.setTemplateSetting('wrap', false);

        const source = platform.generateSourceCode([layersMock[0]], undefined, 'ui');

        expect(source).not.toContain('fn draw_ui<D: DrawTarget<Color = BinaryColor>>(');
        expect(source).toContain('draw_box_veqtjp8jf9ln6isyfz(display)?;');
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
        expect(source).toContain('let pts_Polygon_01_test = [');
        expect(source).toContain('fn draw_ui<D: DrawTarget<Color = BinaryColor>>(');
    });
});