import { getLayerProperties } from '../core/decorators/mapping';
import { AbstractImageLayer } from '../core/layers/abstract-image.layer';
import { AbstractLayer } from '../core/layers/abstract.layer';
import { ttfFonts } from '../draw/fonts/fontTypes';
import { hexWeb2C, toCppVariableName } from '../utils';
import {LVGLParser} from './parsers/lvgl.parser';
import { Platform } from './platform';
import defaultTemplate from './templates/lvgl/default.pug';
import { TextLayer } from '/src/core/layers/text.layer';
import { TextAreaLayer } from '/src/core/layers/text-area.layer';
import { AbstractDrawingRenderer, SmoothDrawingRenderer } from '../draw/renderers';
import {
    LVGL_CHECKBOX_RADIUS,
    LVGL_PANEL_DEFAULT_BG_COLOR,
    LVGL_PANEL_DEFAULT_BORDER_COLOR,
    LVGL_PANEL_DEFAULT_BORDER_WIDTH,
    LVGL_PANEL_DEFAULT_RADIUS,
    LVGL_BUTTON_DEFAULT_BG_COLOR,
    LVGL_BUTTON_DEFAULT_TEXT_COLOR,
    LVGL_BUTTON_DEFAULT_RADIUS,
    LVGL_SWITCH_DEFAULT_COLOR,
    LVGL_SWITCH_DEFAULT_BG_COLOR,
    LVGL_SLIDER_DEFAULT_COLOR,
    LVGL_CHECKBOX_DEFAULT_TEXT_COLOR,
    LVGL_CHECKBOX_DEFAULT_BG_COLOR,
    LVGL_CHECKBOX_DEFAULT_BORDER_COLOR,
    LVGL_TEXTAREA_DEFAULT_BG_COLOR,
    LVGL_TEXTAREA_DEFAULT_BORDER_COLOR,
    LVGL_TEXTAREA_DEFAULT_BORDER_WIDTH,
    LVGL_TEXTAREA_DEFAULT_RADIUS,
    LVGL_TEXTAREA_DEFAULT_TEXT_COLOR,
} from './lvgl/constants';

export class LVGLPlatform extends Platform {
    public static id = 'lvgl';
    protected name = 'LVGL';
    protected description = 'LVGL';
    protected fonts: TPlatformFont[] = [...ttfFonts.filter((font) => font.name == 'Montserrat')];
    protected parser: LVGLParser = new LVGLParser();

    constructor() {
        super();
        this.features = {
            ...this.features,
            hasFonts: false,
            hasImages: true,
            hasCustomFontSize: true,
            hasRGBSupport: true,
            hasAlphaChannel: true,
            // Disable monochrome to keep LVGL assets in RGB565.
            defaultColor: '#000000',
            defaultButtonColor: '#2196f3',
            defaultButtonTextColor: '#ffffff',
            screenBgColor: '#FFFFFF',
            interfaceColors: {
                selectColor: 'rgba(0, 0, 0, 0.9)',
                resizeIconColor: 'rgba(0, 0, 0, 0.6)',
                hoverColor: 'rgba(0, 0, 0, 0.5)',
                rulerColor: '#999',
                rulerLineColor: '#999',
                selectionStrokeColor: 'rgba(0, 0, 0, 0.9)',
            },
        };
    }

    protected templates = {
        Default: {
            template: defaultTemplate,
            settings: {
                wrap: false,
                include_fonts: false,
                declare_vars: true,
                clear_screen: true,
                // include_images: false,
                comments: true,
            },
        },
    };

    generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D, screenTitle?: string): string {
        const declarations: { type: string; data: any }[] = [];
        const rgb565Names: string[] = [];
        const layerData = layers
            .sort((a: AbstractLayer, b: AbstractLayer) => a.index - b.index)
            .map((layer) => {
                const props = getLayerProperties(layer);
                if (layer instanceof AbstractImageLayer) {
                    const name = layer.name ? toCppVariableName(layer.name) : 'paint';
                    const nameRegexp = new RegExp(`${name}_?\d*`);
                    const countWithSameName = rgb565Names.filter((n) => nameRegexp.test(n)).length;
                    const varName = `image_${name + (countWithSameName || name == 'paint' ? `_${countWithSameName}` : '')
                        }_dsc`;
                    rgb565Names.push(varName);
                    props.imageName = varName;
                } else if (
                    // Include fonts referenced by text and text area layers.
                    (layer instanceof TextLayer || layer instanceof TextAreaLayer) &&
                    layer.font.name !== 'default'
                ) {
                    declarations.push({
                        type: 'font',
                        data: {
                            name: layer.font.name,
                            value: layer.font.name,
                        },
                    });
                }
                const overrides = {
                    y: (layer: AbstractLayer, props: any) => {
                        if (layer instanceof TextLayer) {
                            props.y = this.getTextPosition(props)[1];
                        } else {
                            props.y = layer.position.y;
                        }
                    },
                    color: (layer: AbstractLayer, props: any) => {
                        props.color = this.packColor(layer.color);
                    },
                    backgroundColor: (layer: AbstractLayer, props: any) => {
                        props.backgroundColor = this.packColor(layer.backgroundColor);
                    },
                    borderColor: (layer: AbstractLayer, props: any) => {
                        props.borderColor = this.packColor(layer.borderColor);
                    },
                };
                this.processLayerModifiers(layer, props, overrides);
                this.processVarDeclarations(layer, props, declarations);
                return props;
            });
        const source = this.templates[this.currentTemplate].template({
            declarations,
            layers: layerData,
            settings: Object.assign({}, this.settings, this.templates[this.currentTemplate].settings),
            defaultColor: this.packColor(this.features.defaultColor),
            // Provide fixed checkbox tokens for LVGL template styling.
            checkboxRadius: LVGL_CHECKBOX_RADIUS,
            // Panel defaults
            defaultPanelBgColor: this.packColor(LVGL_PANEL_DEFAULT_BG_COLOR),
            defaultPanelBorderColor: this.packColor(LVGL_PANEL_DEFAULT_BORDER_COLOR),
            defaultPanelBorderWidth: LVGL_PANEL_DEFAULT_BORDER_WIDTH,
            defaultPanelRadius: LVGL_PANEL_DEFAULT_RADIUS,
            // Button defaults
            defaultButtonColor: this.packColor(LVGL_BUTTON_DEFAULT_BG_COLOR),
            defaultButtonTextColor: this.packColor(LVGL_BUTTON_DEFAULT_TEXT_COLOR),
            defaultButtonRadius: LVGL_BUTTON_DEFAULT_RADIUS,
            // Switch defaults
            defaultSwitchColor: this.packColor(LVGL_SWITCH_DEFAULT_COLOR),
            defaultSwitchBgColor: this.packColor(LVGL_SWITCH_DEFAULT_BG_COLOR),
            // Slider defaults
            defaultSliderColor: this.packColor(LVGL_SLIDER_DEFAULT_COLOR),
            // Checkbox defaults
            defaultCheckboxTextColor: this.packColor(LVGL_CHECKBOX_DEFAULT_TEXT_COLOR),
            defaultCheckboxBgColor: this.packColor(LVGL_CHECKBOX_DEFAULT_BG_COLOR),
            defaultCheckboxBorderColor: this.packColor(LVGL_CHECKBOX_DEFAULT_BORDER_COLOR),
            // TextArea defaults
            defaultTextareaBgColor: this.packColor(LVGL_TEXTAREA_DEFAULT_BG_COLOR),
            defaultTextareaBorderColor: this.packColor(LVGL_TEXTAREA_DEFAULT_BORDER_COLOR),
            defaultTextareaBorderWidth: LVGL_TEXTAREA_DEFAULT_BORDER_WIDTH,
            defaultTextareaRadius: LVGL_TEXTAREA_DEFAULT_RADIUS,
            defaultTextareaTextColor: this.packColor(LVGL_TEXTAREA_DEFAULT_TEXT_COLOR),
            clear_screen_method: this.features.screenBgColor?.toUpperCase() !== '#FFFFFF'
                ? `lv_obj_set_style_bg_color(lv_screen_active(), lv_color_hex(${this.packColor(this.features.screenBgColor)}), LV_PART_MAIN)`
                : '',
            toCppVariableName,
            screenTitle: screenTitle ? toCppVariableName(screenTitle) : '',
        });
        return source;
    }

    packColor(color: string): string {
        return hexWeb2C(color);
    }

    /**
     * Create a smooth drawing renderer for LVGL
     * @returns Smooth drawing renderer for vector-based drawing
     */
    public createRenderer(): AbstractDrawingRenderer {
        return new SmoothDrawingRenderer();
    }
}
