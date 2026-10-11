import {describe, expect, it} from 'vitest';
import {AdafruitParser} from './adafruit.parser';
import {ArduinoGFXParser} from './arduinogfx.parser';
import {TFTeSPIParser} from './tft-espi.parser';
import {U8g2Parser} from './u8g2.parser';
import {FlipperParser} from './flipper.parser';
import {GxEPD2Parser} from './gxepd2.parser';
import {InkplateParser} from './inkplate.parser';
import {MicropythonParser} from './micropython.parser';
import {EsphomeParser} from './esphome.parser';
import {LVGLParser} from './lvgl.parser';
import {parseLayerTitles} from './layer-titles';
import {AdafruitMonochromePlatform} from '../adafruit_mono';
import {U8g2Platform} from '../u8g2';
import {FlipperPlatform} from '../flipper';
import {MicropythonPlatform} from '../micropython';
import {RectangleLayer} from '../../core/layers/rectangle.layer';

describe('imported layer titles', () => {
    it.each([
        ['Adafruit mono', () => new AdafruitMonochromePlatform()],
        ['U8g2', () => new U8g2Platform()],
        ['Flipper', () => new FlipperPlatform()],
        ['MicroPython', () => new MicropythonPlatform()],
    ] as const)('%s preserves names through export and import', (_, create) => {
        const platform = create();
        const layers = ['Battery / Батарея', 'Border 2'].map((name, index) => {
            const layer = new RectangleLayer(platform.features);
            layer.state = {t: 'rect', n: name, c: '#ffffff', f: false, i: index, p: [index * 10, 2], u: `rect${index}`, s: [8, 8]};
            return layer;
        });
        for (const wrap of [true, false]) {
            platform.setTemplateSetting('wrap', wrap);
            platform.setTemplateSetting('comments', true);
            const code = platform.sourceMapParser.parse(platform.generateSourceCode(layers)).code;
            expect(platform.importSourceCode(code).states.map(state => state.name)).toEqual(layers.map(layer => layer.name));
            platform.setTemplateSetting('comments', false);
            const unnamed = platform.sourceMapParser.parse(platform.generateSourceCode(layers)).code;
            expect(platform.importSourceCode(unnamed).states.map(state => state.name)).toEqual([undefined, undefined]);
        }
    });
    it.each([
        ['Adafruit', () => new AdafruitParser(), 'display.drawRect(1, 2, 3, 4, 1);'],
        ['ArduinoGFX', () => new ArduinoGFXParser(), 'gfx->drawRect(1, 2, 3, 4, 1);'],
        ['TFT_eSPI', () => new TFTeSPIParser(), 'tft.drawRect(1, 2, 3, 4, 1);'],
        ['U8g2 C++', () => new U8g2Parser(), 'u8g2.drawFrame(1, 2, 3, 4);'],
        ['U8g2 C', () => new U8g2Parser(), 'u8g2_DrawFrame(&u8g2, 1, 2, 3, 4);'],
        ['Flipper', () => new FlipperParser(), 'canvas_draw_frame(canvas, 1, 2, 3, 4);'],
        ['GxEPD2', () => new GxEPD2Parser(), 'display.drawRect(1, 2, 3, 4, GxEPD_BLACK);'],
        ['Inkplate', () => new InkplateParser(), 'display.drawRect(1, 2, 3, 4, 1);'],
        ['ESPHome', () => new EsphomeParser(), 'it.rectangle(1, 2, 3, 4);'],
    ] as const)('%s restores titles without leaking them to unnamed layers', (_, create, command) => {
        const parser = create();
        const source = `// Рамка: батарея 50%\r\n${command}\r\n${command}\r\n// Second\r\n${command}`;
        const result = parser.importSourceCode(source);
        expect(result.warnings).toEqual([]);
        expect(result.states.map(state => state.name)).toEqual(['Рамка: батарея 50%', undefined, 'Second']);
        // Names and consumed-comment state must not survive a subsequent import.
        expect(parser.importSourceCode(command).states.map(state => state.name)).toEqual([undefined]);
    });

    it('retains a title across text setup calls and preserves URL text', () => {
        const result = new AdafruitParser().importSourceCode(`
void draw() {
    // Website
    display.setTextColor(1);
    display.setTextSize(1);
    display.setCursor(2, 3);
    display.print("https://example.com/#home"); // not a title
    display.drawRect(1, 2, 3, 4, 1);
}`);
        expect(result.states).toHaveLength(2);
        expect(result.states[0]).toMatchObject({name: 'Website', text: 'https://example.com/#home'});
        expect(result.states[1]).not.toHaveProperty('name');
    });

    it('does not parse drawing commands inside comments or use a function comment as a title', () => {
        const result = new U8g2Parser().importSourceCode(`
// Utility function
void draw() {
    /* u8g2.drawFrame(0, 0, 10, 10); */
    u8g2.drawFrame(1, 2, 3, 4); // trailing comment
}
// u8g2.drawFrame(0, 0, 10, 10);`);
        expect(result.states).toHaveLength(1);
        expect(result.states[0]).not.toHaveProperty('name');
    });

    it('restores Python titles and preserves hashes inside strings', () => {
        const result = new MicropythonParser().importSourceCode(`
# Caption
display.text("Value #1", 1, 2, 1)
display.rect(1, 2, 3, 4, 1) # inline
# Border
display.rect(1, 2, 3, 4, 1)
`);
        expect(result.states.map(state => state.name)).toEqual(['Caption', undefined, 'Border']);
        expect(result.states[0].text).toBe('Value #1');
    });

    it('restores LVGL titles without assigning a child label title to another widget', () => {
        const result = new LVGLParser().importSourceCode(`
// button: Start / Старт
lv_obj_t * button_start = lv_button_create(lv_screen_active());
lv_obj_t * label = lv_label_create(button_start);
lv_label_set_text(label, "Go");
// string: Status: ready
lv_obj_t * label_status = lv_label_create(lv_screen_active());
lv_label_set_text(label_status, "Ready");
lv_obj_t * unnamed = lv_switch_create(lv_screen_active());
`);
        expect(result.states.map(state => state.name)).toEqual(['Start / Старт', 'Status: ready', undefined]);
        expect(result.states.map(state => state.type)).toEqual(['button', 'string', 'switch']);
    });

    it('keeps source offsets and escaped quotes while masking comments', () => {
        const source = 'display.print("a\\\"//b"); /* comment */\r\n// Title\r\ndisplay.drawRect(1,2,3,4,1);';
        const parsed = parseLayerTitles(source);
        expect(parsed.code.length).toBe(source.length);
        expect(parsed.code).toContain('"a\\\"//b"');
        expect(parsed.code.indexOf('drawRect')).toBe(source.indexOf('drawRect'));
        expect(parsed.titleAt(source.indexOf('drawRect'))?.name).toBe('Title');
    });

    it('strips the type prefix from legacy LVGL rectangles', () => {
        const {states} = new LVGLParser().importSourceCode(`
// rect: Border
display.drawRect(1, 2, 3, 4, 0xFFFF);
// rect: Rounded
display.drawRoundRect(1, 2, 3, 4, 1, 0xFFFF);
`);
        expect(states.map(state => state.name)).toEqual(['Border', 'Rounded']);
    });
});
