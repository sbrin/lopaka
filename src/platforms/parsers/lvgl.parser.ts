import {Point} from '../../core/point';
import {LVGL_DEFAULT_TTF_FONT_SIZE} from '../lvgl/constants';
import {AbstractParser} from './abstract-parser';

type LVGLWidget = {
    varName: string;
    widgetType: string;
    parentVar: string | null;
    state: Record<string, any>;
};

const CREATE_FN_MAP: Record<string, string> = {
    lv_obj_create: 'panel',
    lv_button_create: 'button',
    lv_label_create: 'string',
    lv_checkbox_create: 'checkbox',
    lv_switch_create: 'switch',
    lv_slider_create: 'slider',
    lv_textarea_create: 'textarea',
    lv_image_create: 'paint',
};

export class LVGLParser extends AbstractParser {
    private lvglCreateRegex = /lv_obj_t\s*\*\s*(\w+)\s*=\s*(lv_\w+_create)\s*\(([^)]*)\)/g;

    importSourceCode(sourceCode: string): {states: any[]; warnings: string[]} {
        const {methods, defines, variables} = this.parseSourceCode(sourceCode);
        const warnings: string[] = [];
        const states: any[] = [];

        // Phase 1: Discover widgets from create calls
        const widgets = this.discoverWidgets(sourceCode);

        // Track child labels (labels created inside buttons/other widgets)
        const childToParent = new Map<string, string>();
        for (const [varName, widget] of widgets) {
            if (widget.widgetType === 'string' && widget.parentVar) {
                const parent = widgets.get(widget.parentVar);
                if (parent) {
                    childToParent.set(varName, widget.parentVar);
                }
            }
        }

        // Phase 2: Collect properties from method calls
        methods.forEach((call) => {
            const args = this.getArgs(call.args, defines, variables);

            // Handle legacy display.* rect calls
            switch (call.functionName) {
                case 'fillRect':
                case 'drawRect': {
                    const [x, y, width, height, color] = args;
                    states.push({
                        type: 'rect',
                        position: new Point(parseInt(x), parseInt(y)),
                        size: new Point(parseInt(width), parseInt(height)),
                        fill: call.functionName === 'fillRect',
                        color: this.parseDirectColor(color),
                    });
                    return;
                }
                case 'fillRoundRect':
                case 'drawRoundRect': {
                    const [x, y, width, height, radius, color] = args;
                    states.push({
                        type: 'rect',
                        position: new Point(parseInt(x), parseInt(y)),
                        size: new Point(parseInt(width), parseInt(height)),
                        fill: call.functionName === 'fillRoundRect',
                        radius: parseInt(radius),
                        color: this.parseDirectColor(color),
                    });
                    return;
                }
            }

            // For LVGL API calls, the first arg is the target variable
            const targetVar = args[0];
            if (!targetVar) return;

            // Skip calls on lv_screen_active() (screen-level calls)
            if (targetVar.includes('lv_screen_active')) return;

            // Resolve target: if it's a child label, route to parent
            let widget: LVGLWidget | undefined;
            const parentVar = childToParent.get(targetVar);
            if (parentVar) {
                widget = widgets.get(parentVar);
            } else {
                widget = widgets.get(targetVar);
            }

            if (!widget) return;

            switch (call.functionName) {
                case 'lv_obj_set_pos': {
                    widget.state.position = new Point(parseInt(args[1]), parseInt(args[2]));
                    break;
                }
                case 'lv_obj_set_size': {
                    widget.state.size = new Point(parseInt(args[1]), parseInt(args[2]));
                    break;
                }
                case 'lv_label_set_text': {
                    widget.state.text = this.parseText(args[1]);
                    break;
                }
                case 'lv_textarea_set_text': {
                    widget.state.text = this.parseText(args[1]);
                    break;
                }
                case 'lv_checkbox_set_text': {
                    widget.state.text = this.parseText(args[1]);
                    break;
                }
                case 'lv_obj_add_state': {
                    if (args[1] && args[1].includes('LV_STATE_CHECKED')) {
                        widget.state.checked = true;
                    }
                    break;
                }
                case 'lv_image_set_src': {
                    widget.state.imageName = args[1] ? args[1].replace('&', '') : undefined;
                    break;
                }
                // Style calls
                case 'lv_obj_set_style_bg_color': {
                    this.handleBgColor(widget, args);
                    break;
                }
                case 'lv_obj_set_style_text_color': {
                    const color = this.parseLvglColor(args[1]);
                    if (color) {
                        const part = args[2] || '';
                        // For checkbox, text_color on INDICATOR|CHECKED is derived from backgroundColor, skip
                        if (widget.widgetType === 'checkbox' && part.includes('LV_STATE_CHECKED')) {
                            break;
                        }
                        widget.state.color = color;
                    }
                    break;
                }
                case 'lv_obj_set_style_border_color': {
                    const color = this.parseLvglColor(args[1]);
                    if (color) {
                        widget.state.borderColor = color;
                    }
                    break;
                }
                case 'lv_obj_set_style_border_width': {
                    widget.state.borderWidth = parseInt(args[1]);
                    break;
                }
                case 'lv_obj_set_style_radius': {
                    widget.state.radius = parseInt(args[1]);
                    break;
                }
                // No-ops for import
                case 'lv_obj_center':
                case 'lv_slider_set_value':
                case 'LV_IMAGE_DECLARE':
                    break;
            }
        });

        // Phase 3: Emit states from widgets (skip child labels)
        for (const [varName, widget] of widgets) {
            if (childToParent.has(varName)) continue;
            const state: Record<string, any> = {type: widget.widgetType, ...widget.state};
            // Default font to '' for text layers so session skips font lookup
            if (state.type === 'string' && state.font === undefined) {
                state.font = '';
            }
            // Reverse the Y offset applied during code generation for text labels.
            // Generated code uses top-left Y (position.y - textHeight), so we add
            // the text height back to recover the baseline position the layer expects.
            if (state.type === 'string' && state.position) {
                state.position = new Point(
                    state.position.x,
                    state.position.y + LVGL_DEFAULT_TTF_FONT_SIZE
                );
            }
            states.push(state);
        }

        return {states, warnings};
    }

    private discoverWidgets(sourceCode: string): Map<string, LVGLWidget> {
        const widgets = new Map<string, LVGLWidget>();
        const cleanedCode = sourceCode.replace(/\/\/[^\n]*\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '');
        let match: RegExpExecArray | null;

        // Reset regex state
        this.lvglCreateRegex.lastIndex = 0;
        while ((match = this.lvglCreateRegex.exec(cleanedCode)) !== null) {
            const varName = match[1];
            const createFunc = match[2];
            const parentArg = match[3].trim();

            const widgetType = CREATE_FN_MAP[createFunc];
            if (!widgetType) continue;

            const isScreenParent = parentArg.includes('lv_screen_active');
            let parentVar: string | null = null;
            if (!isScreenParent) {
                // Parent is another widget variable
                parentVar = parentArg;
            }

            widgets.set(varName, {
                varName,
                widgetType,
                parentVar,
                state: {},
            });
        }

        return widgets;
    }

    private handleBgColor(widget: LVGLWidget, args: string[]): void {
        const color = this.parseLvglColor(args[1]);
        if (!color) return;

        const part = args[2] || '';

        switch (widget.widgetType) {
            case 'switch':
                if (part.includes('LV_STATE_CHECKED')) {
                    widget.state.color = color;
                } else {
                    widget.state.backgroundColor = color;
                }
                break;
            case 'checkbox':
                // bg_color on INDICATOR|CHECKED is derived from borderColor in template, skip
                if (!part.includes('LV_STATE_CHECKED')) {
                    widget.state.backgroundColor = color;
                }
                break;
            case 'slider':
                widget.state.color = color;
                break;
            default:
                // panel, button, textarea, etc.
                widget.state.backgroundColor = color;
                break;
        }
    }

    private parseLvglColor(arg: string): string | null {
        if (!arg) return null;
        const match = arg.match(/lv_color_hex\s*\(\s*0x([0-9a-fA-F]{1,6})\s*\)/);
        if (match) {
            return '#' + match[1].padStart(6, '0');
        }
        return null;
    }

    private parseDirectColor(color: string): string {
        if (!color) return '#000000';
        // Handle 0xRRGGBB format
        const hex = color.replace('0x', '').replace('0X', '');
        if (/^[0-9a-fA-F]{1,6}$/.test(hex)) {
            return '#' + hex.padStart(6, '0');
        }
        return '#000000';
    }

    private parseText(arg: string): string {
        if (!arg) return '';
        // Remove surrounding quotes if present
        return arg.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
    }
}
