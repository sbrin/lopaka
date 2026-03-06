import {describe, expect, it, vi} from 'vitest';
import {LVGLPlatform} from './lvgl';
import {TextAreaLayer} from '../core/layers/text-area.layer';
import {Point} from '../core/point';
import {PixelatedDrawingRenderer} from '../draw/renderers/pixelated-drawing-renderer';
import {FontFormat} from '../draw/fonts/font';
import {toCppVariableName} from '../utils';

// Mock session to avoid circular imports when loading layers in tests.
vi.mock('/src/core/session', () => ({
    useSession: () => ({
        state: {
            warnings: [],
        },
    }),
}));

describe('LVGL platform', () => {
    it('generates source code for text area layers', () => {
        // Arrange a platform instance for LVGL.
        const platform = new LVGLPlatform();
        // Arrange a fake font for deterministic sizing.
        const fakeFont = {
            getSize: () => new Point(10, 10),
            drawText: () => undefined,
            format: FontFormat.FORMAT_TTF,
            name: 'Montserrat',
        };
        // Arrange a text area layer with panel and text properties.
        const layer = new TextAreaLayer(platform.features, new PixelatedDrawingRenderer(), fakeFont as any);
        // Assign stable identifiers for snapshot output.
        layer.name = 'TextArea';
        layer.uid = 'text_area_uid';
        layer.position = new Point(10, 12);
        layer.size = new Point(80, 40);
        layer.radius = 6;
        layer.backgroundColor = '#FFFFFF';
        layer.borderColor = '#222222';
        layer.borderWidth = 2;
        layer.color = '#111111';
        layer.text = 'Hello world';

        // Act by generating LVGL source.
        const source = platform.generateSourceCode([layer]);

        // Assert the LVGL textarea widget is used for text area layers.
        const textareaName = `textarea_${toCppVariableName(layer.name)}`;
        expect(source).toContain(`lv_textarea_create`);
        expect(source).toContain(`lv_textarea_set_text(${textareaName}, "Hello world")`);
        expect(source).toContain(`lv_obj_set_pos(${textareaName}, 10, 12)`);
        expect(source).toContain(`lv_obj_set_size(${textareaName}, 80, 40)`);
        expect(source).not.toContain('lv_label_create');
    });

    it('escapes textarea newlines as \\n literals', () => {
        // Arrange a platform instance for LVGL.
        const platform = new LVGLPlatform();
        // Arrange a fake font for deterministic sizing.
        const fakeFont = {
            getSize: () => new Point(10, 10),
            drawText: () => undefined,
            format: FontFormat.FORMAT_TTF,
            name: 'Montserrat',
        };
        // Arrange a text area layer with multiline text.
        const layer = new TextAreaLayer(platform.features, new PixelatedDrawingRenderer(), fakeFont as any);
        // Assign stable identifiers for snapshot output.
        layer.name = 'TextArea';
        layer.uid = 'text_area_uid';
        layer.position = new Point(10, 12);
        layer.size = new Point(80, 40);
        layer.radius = 6;
        layer.backgroundColor = '#FFFFFF';
        layer.borderColor = '#222222';
        layer.borderWidth = 2;
        layer.color = '#111111';
        layer.text = 'Line 1\nLine 2';

        // Act by generating LVGL source.
        const source = platform.generateSourceCode([layer]);

        // Assert newlines are escaped for LVGL string literals.
        const textareaName = `textarea_${toCppVariableName(layer.name)}`;
        expect(source).toContain(`lv_textarea_set_text(${textareaName}, "Line 1\\nLine 2")`);
    });
});
