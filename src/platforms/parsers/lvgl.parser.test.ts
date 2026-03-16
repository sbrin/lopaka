import {describe, expect, it} from 'vitest';
import {LVGLParser} from './lvgl.parser';

describe('LVGL parser', () => {
    const parser = new LVGLParser();

    it('parses a button with label', () => {
        const code = `
            lv_obj_t * button_my_btn = lv_button_create(lv_screen_active());
            lv_obj_set_pos(button_my_btn, 10, 20);
            lv_obj_set_size(button_my_btn, 80, 40);
            lv_obj_set_style_radius(button_my_btn, 8, LV_PART_MAIN);
            lv_obj_set_style_bg_color(button_my_btn, lv_color_hex(0x2196f3), LV_PART_MAIN);
            lv_obj_set_style_text_color(button_my_btn, lv_color_hex(0xffffff), LV_PART_MAIN);
            lv_obj_t * button_my_btn_label = lv_label_create(button_my_btn);
            lv_label_set_text(button_my_btn_label, "Click Me");
            lv_obj_center(button_my_btn_label);
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        // Should produce exactly 1 state (button), label is merged into button
        expect(states).toHaveLength(1);
        expect(states[0].type).toBe('button');
        expect(states[0].position.x).toBe(10);
        expect(states[0].position.y).toBe(20);
        expect(states[0].size.x).toBe(80);
        expect(states[0].size.y).toBe(40);
        expect(states[0].radius).toBe(8);
        expect(states[0].backgroundColor).toBe('#2196f3');
        expect(states[0].color).toBe('#ffffff');
        expect(states[0].text).toBe('Click Me');
    });

    it('parses a panel with custom styles', () => {
        const code = `
            lv_obj_t * panel_my_panel = lv_obj_create(lv_screen_active());
            lv_obj_set_pos(panel_my_panel, 5, 10);
            lv_obj_set_size(panel_my_panel, 200, 150);
            lv_obj_set_style_bg_color(panel_my_panel, lv_color_hex(0xeeeeee), LV_PART_MAIN);
            lv_obj_set_style_border_width(panel_my_panel, 3, LV_PART_MAIN);
            lv_obj_set_style_border_color(panel_my_panel, lv_color_hex(0xaabbcc), LV_PART_MAIN);
            lv_obj_set_style_radius(panel_my_panel, 10, LV_PART_MAIN);
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        expect(states).toHaveLength(1);
        expect(states[0].type).toBe('panel');
        expect(states[0].position.x).toBe(5);
        expect(states[0].position.y).toBe(10);
        expect(states[0].size.x).toBe(200);
        expect(states[0].size.y).toBe(150);
        expect(states[0].backgroundColor).toBe('#eeeeee');
        expect(states[0].borderWidth).toBe(3);
        expect(states[0].borderColor).toBe('#aabbcc');
        expect(states[0].radius).toBe(10);
    });

    it('parses a standalone label as string layer', () => {
        const code = `
            lv_obj_t * label_hello = lv_label_create(lv_screen_active());
            lv_obj_set_style_text_color(label_hello, lv_color_hex(0xff0000), LV_PART_MAIN);
            lv_obj_set_pos(label_hello, 30, 50);
            lv_label_set_text(label_hello, "Hello World");
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        expect(states).toHaveLength(1);
        expect(states[0].type).toBe('string');
        expect(states[0].position.x).toBe(30);
        // Y is adjusted by +14 (default TTF font size) to reverse the generation offset
        expect(states[0].position.y).toBe(64);
        expect(states[0].text).toBe('Hello World');
        expect(states[0].color).toBe('#ff0000');
    });

    it('parses a checkbox with checked state', () => {
        const code = `
            lv_obj_t * checkbox_agree = lv_checkbox_create(lv_screen_active());
            lv_obj_set_pos(checkbox_agree, 15, 25);
            lv_checkbox_set_text(checkbox_agree, "I Agree");
            lv_obj_add_state(checkbox_agree, LV_STATE_CHECKED);
            lv_obj_set_style_border_color(checkbox_agree, lv_color_hex(0x2196f3), LV_PART_INDICATOR);
            lv_obj_set_style_bg_color(checkbox_agree, lv_color_hex(0x2196f3), LV_PART_INDICATOR | LV_STATE_CHECKED);
            lv_obj_set_style_bg_color(checkbox_agree, lv_color_hex(0xffffff), LV_PART_INDICATOR);
            lv_obj_set_style_text_color(checkbox_agree, lv_color_hex(0xffffff), LV_PART_INDICATOR | LV_STATE_CHECKED);
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        expect(states).toHaveLength(1);
        expect(states[0].type).toBe('checkbox');
        expect(states[0].position.x).toBe(15);
        expect(states[0].position.y).toBe(25);
        expect(states[0].text).toBe('I Agree');
        expect(states[0].checked).toBe(true);
        expect(states[0].borderColor).toBe('#2196f3');
        expect(states[0].backgroundColor).toBe('#ffffff');
    });

    it('parses a switch with custom colors', () => {
        const code = `
            lv_obj_t * switch_toggle = lv_switch_create(lv_screen_active());
            lv_obj_set_pos(switch_toggle, 100, 50);
            lv_obj_set_size(switch_toggle, 50, 25);
            lv_obj_add_state(switch_toggle, LV_STATE_CHECKED);
            lv_obj_set_style_bg_color(switch_toggle, lv_color_hex(0xff5722), LV_PART_INDICATOR | LV_STATE_CHECKED);
            lv_obj_set_style_bg_color(switch_toggle, lv_color_hex(0xcccccc), LV_PART_MAIN);
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        expect(states).toHaveLength(1);
        expect(states[0].type).toBe('switch');
        expect(states[0].position.x).toBe(100);
        expect(states[0].position.y).toBe(50);
        expect(states[0].size.x).toBe(50);
        expect(states[0].size.y).toBe(25);
        expect(states[0].checked).toBe(true);
        expect(states[0].color).toBe('#ff5722');
        expect(states[0].backgroundColor).toBe('#cccccc');
    });

    it('parses a slider with custom color', () => {
        const code = `
            lv_obj_t * slider_vol = lv_slider_create(lv_screen_active());
            lv_slider_set_value(slider_vol, 50, LV_ANIM_OFF);
            lv_obj_set_pos(slider_vol, 20, 80);
            lv_obj_set_size(slider_vol, 120, 10);
            lv_obj_set_style_bg_color(slider_vol, lv_color_hex(0x4caf50), LV_PART_INDICATOR);
            lv_obj_set_style_bg_color(slider_vol, lv_color_hex(0x4caf50), LV_PART_KNOB);
            lv_obj_set_style_bg_color(slider_vol, lv_color_hex(0x4caf50), LV_PART_MAIN);
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        expect(states).toHaveLength(1);
        expect(states[0].type).toBe('slider');
        expect(states[0].position.x).toBe(20);
        expect(states[0].position.y).toBe(80);
        expect(states[0].size.x).toBe(120);
        expect(states[0].size.y).toBe(10);
        expect(states[0].color).toBe('#4caf50');
    });

    it('parses a textarea', () => {
        const code = `
            lv_obj_t * textarea_input = lv_textarea_create(lv_screen_active());
            lv_textarea_set_text(textarea_input, "Hello world");
            lv_obj_set_pos(textarea_input, 10, 12);
            lv_obj_set_size(textarea_input, 80, 40);
            lv_obj_set_style_bg_color(textarea_input, lv_color_hex(0xfafafa), LV_PART_MAIN);
            lv_obj_set_style_border_color(textarea_input, lv_color_hex(0x999999), LV_PART_MAIN);
            lv_obj_set_style_border_width(textarea_input, 1, LV_PART_MAIN);
            lv_obj_set_style_radius(textarea_input, 4, LV_PART_MAIN);
            lv_obj_set_style_text_color(textarea_input, lv_color_hex(0x333333), LV_PART_MAIN);
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        expect(states).toHaveLength(1);
        expect(states[0].type).toBe('textarea');
        expect(states[0].position.x).toBe(10);
        expect(states[0].position.y).toBe(12);
        expect(states[0].size.x).toBe(80);
        expect(states[0].size.y).toBe(40);
        expect(states[0].text).toBe('Hello world');
        expect(states[0].backgroundColor).toBe('#fafafa');
        expect(states[0].borderColor).toBe('#999999');
        expect(states[0].borderWidth).toBe(1);
        expect(states[0].radius).toBe(4);
        expect(states[0].color).toBe('#333333');
    });

    it('parses an image widget', () => {
        const code = `
            LV_IMAGE_DECLARE(image_logo_dsc);
            lv_obj_t * image_logo = lv_image_create(lv_screen_active());
            lv_image_set_src(image_logo, &image_logo_dsc);
            lv_obj_set_pos(image_logo, 10, 10);
            lv_obj_set_size(image_logo, 64, 64);
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        expect(states).toHaveLength(1);
        expect(states[0].type).toBe('paint');
        expect(states[0].position.x).toBe(10);
        expect(states[0].position.y).toBe(10);
        expect(states[0].size.x).toBe(64);
        expect(states[0].size.y).toBe(64);
        expect(states[0].imageName).toBe('image_logo_dsc');
    });

    it('parses legacy rect calls', () => {
        const code = `
            display.fillRect(5, 10, 100, 50, 0x000000);
            display.drawRoundRect(20, 30, 60, 40, 5, 0xff0000);
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        expect(states).toHaveLength(2);

        expect(states[0].type).toBe('rect');
        expect(states[0].position.x).toBe(5);
        expect(states[0].position.y).toBe(10);
        expect(states[0].size.x).toBe(100);
        expect(states[0].size.y).toBe(50);
        expect(states[0].fill).toBe(true);
        expect(states[0].color).toBe('#000000');

        expect(states[1].type).toBe('rect');
        expect(states[1].position.x).toBe(20);
        expect(states[1].position.y).toBe(30);
        expect(states[1].size.x).toBe(60);
        expect(states[1].size.y).toBe(40);
        expect(states[1].fill).toBe(false);
        expect(states[1].radius).toBe(5);
        expect(states[1].color).toBe('#ff0000');
    });

    it('parses multiple widgets', () => {
        const code = `
            lv_obj_t * panel_bg = lv_obj_create(lv_screen_active());
            lv_obj_set_pos(panel_bg, 0, 0);
            lv_obj_set_size(panel_bg, 320, 240);

            lv_obj_t * button_ok = lv_button_create(lv_screen_active());
            lv_obj_set_pos(button_ok, 100, 180);
            lv_obj_set_size(button_ok, 60, 30);
            lv_obj_t * button_ok_label = lv_label_create(button_ok);
            lv_label_set_text(button_ok_label, "OK");
            lv_obj_center(button_ok_label);

            lv_obj_t * label_title = lv_label_create(lv_screen_active());
            lv_obj_set_pos(label_title, 50, 10);
            lv_label_set_text(label_title, "Settings");
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        // panel + button + label = 3 states (button label is merged)
        expect(states).toHaveLength(3);
        expect(states[0].type).toBe('panel');
        expect(states[1].type).toBe('button');
        expect(states[1].text).toBe('OK');
        expect(states[2].type).toBe('string');
        expect(states[2].text).toBe('Settings');
    });

    it('handles comments in source code', () => {
        const code = `
            // Create a button
            lv_obj_t * button_test = lv_button_create(lv_screen_active());
            lv_obj_set_pos(button_test, 10, 20);
            lv_obj_set_size(button_test, 80, 40);
            /* Set the label */
            lv_obj_t * button_test_label = lv_label_create(button_test);
            lv_label_set_text(button_test_label, "Test");
            lv_obj_center(button_test_label);
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        expect(states).toHaveLength(1);
        expect(states[0].type).toBe('button');
        expect(states[0].text).toBe('Test');
    });

    it('skips screen-level style calls', () => {
        const code = `
            lv_obj_set_style_bg_color(lv_screen_active(), lv_color_hex(0xffcc00), LV_PART_MAIN);
            lv_obj_t * label_1 = lv_label_create(lv_screen_active());
            lv_obj_set_pos(label_1, 0, 0);
            lv_label_set_text(label_1, "Text");
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        expect(states).toHaveLength(1);
        expect(states[0].type).toBe('string');
        expect(states[0].text).toBe('Text');
    });

    it('parses button with default styles (no style calls)', () => {
        const code = `
            lv_obj_t * button_simple = lv_button_create(lv_screen_active());
            lv_obj_set_pos(button_simple, 0, 0);
            lv_obj_set_size(button_simple, 100, 50);
            lv_obj_t * button_simple_label = lv_label_create(button_simple);
            lv_label_set_text(button_simple_label, "Simple");
            lv_obj_center(button_simple_label);
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        expect(states).toHaveLength(1);
        expect(states[0].type).toBe('button');
        expect(states[0].text).toBe('Simple');
        // No explicit style calls, so these shouldn't be set
        expect(states[0].backgroundColor).toBeUndefined();
        expect(states[0].color).toBeUndefined();
        expect(states[0].radius).toBeUndefined();
    });

    it('parses switch without checked state', () => {
        const code = `
            lv_obj_t * switch_off = lv_switch_create(lv_screen_active());
            lv_obj_set_pos(switch_off, 10, 10);
            lv_obj_set_size(switch_off, 50, 25);
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        expect(states).toHaveLength(1);
        expect(states[0].type).toBe('switch');
        expect(states[0].checked).toBeUndefined();
    });

    it('handles mixed LVGL widgets and legacy rect calls', () => {
        const code = `
            display.fillRect(0, 0, 320, 240, 0xffffff);
            lv_obj_t * label_msg = lv_label_create(lv_screen_active());
            lv_obj_set_pos(label_msg, 10, 10);
            lv_label_set_text(label_msg, "Message");
        `;
        const {states, warnings} = parser.importSourceCode(code);

        expect(warnings).toHaveLength(0);
        // rect comes first (from method processing), then label (from widget emission)
        expect(states).toHaveLength(2);
        expect(states[0].type).toBe('rect');
        expect(states[1].type).toBe('string');
        expect(states[1].text).toBe('Message');
    });
});
