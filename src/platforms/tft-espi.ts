import {getLayerProperties} from '/src/core/decorators/mapping';
import {AbstractImageLayer} from '/src/core/layers/abstract-image.layer';
import {AbstractLayer} from '/src/core/layers/abstract.layer';
import {adafruitFonts, gfxFonts} from '../draw/fonts/fontTypes';
import {flattenImageDataToBackground, imgDataToRGB565, imgDataToXBMP, toCppVariableName} from '../utils';
import {Platform} from './platform';
import defaultTemplate from './templates/tft-espi/default.pug';
import {getFont} from '../draw/fonts';
import {GFXFont} from '../draw/fonts/gfx.font';
import {AbstractParser} from './parsers/abstract-parser';
import {TFTeSPIParser} from './parsers/tft-espi.parser';
import {TextLayer} from '/src/core/layers/text.layer';

export class TFTeSPIPlatform extends Platform {
    public static id = 'tft-espi';
    protected name = 'TFT_eSPI, M5, Lovyan';
    protected description = 'TFT_eSPI';
    protected fonts: TPlatformFont[] = [adafruitFonts['adafruit'], ...gfxFonts];
    protected parser: AbstractParser = new TFTeSPIParser();

    constructor() {
        super();
        this.features.hasCustomFontSize = true;
        this.features.hasRGBSupport = true;
        this.features.defaultColor = '#FFFFFF';
    }

    protected templates = {
        Default: {
            template: defaultTemplate,
            settings: {
                wrap: false,
                include_fonts: false,
                include_images: true,
                declare_vars: true,
                comments: false,
                clear_screen: true,
            },
        },
    };

    generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D, screenTitle?: string): string {
        const declarations: {type: string; data: any}[] = [];
        const xbmps = [];
        const xbmpsNames = [];
        const rgb565Bitmaps: string[] = [];
        const rgb565Names: string[] = [];
        const layerData = layers
            .sort((a: AbstractLayer, b: AbstractLayer) => a.index - b.index)
            .map((layer) => {
                const props = getLayerProperties(layer);
                if (layer instanceof AbstractImageLayer) {
                    if (layer.colorMode === 'rgb') {
                        // Flatten RGB data when alpha is disabled so backgrounds render correctly.
                        const sourceData =
                            layer.alphaChannel === false
                                ? flattenImageDataToBackground(layer.data, this.features.screenBgColor ?? '#000000')
                                : layer.data;
                        const bitmap565 = imgDataToRGB565(sourceData, 0, 0, layer.size.x, layer.size.y, 'low').join(
                            ','
                        );
                        if (rgb565Bitmaps.includes(bitmap565)) {
                            props.imageName = rgb565Names[rgb565Bitmaps.indexOf(bitmap565)];
                        } else {
                            const name = layer.name ? toCppVariableName(layer.name) : 'paint';
                            const nameRegexp = new RegExp(`${name}_?\d*`);
                            const countWithSameName = rgb565Names.filter((n) => nameRegexp.test(n)).length;
                            const varName = `image_${
                                name + (countWithSameName || name == 'paint' ? `_${countWithSameName}` : '')
                            }_pixels`;
                            declarations.push({
                                type: 'bitmap565',
                                data: {
                                    name: varName,
                                    value: bitmap565,
                                },
                            });
                            rgb565Bitmaps.push(bitmap565);
                            rgb565Names.push(varName);
                            props.imageName = varName;
                        }
                    } else {
                        const XBMP = imgDataToXBMP(layer.data, 0, 0, layer.size.x, layer.size.y, true).join(',');
                        if (xbmps.includes(XBMP)) {
                            props.imageName = xbmpsNames[xbmps.indexOf(XBMP)];
                        } else {
                            const name = layer.name ? toCppVariableName(layer.name) : 'paint';
                            const nameRegexp = new RegExp(`${name}_?\d*`);
                            const countWithSameName = xbmpsNames.filter((n) => nameRegexp.test(n)).length;
                            const varName = `image_${
                                name + (countWithSameName || name == 'paint' ? `_${countWithSameName}` : '')
                            }_bits`;
                            declarations.push({
                                type: 'bitmap',
                                data: {
                                    name: varName,
                                    value: XBMP,
                                },
                            });
                            xbmps.push(XBMP);
                            xbmpsNames.push(varName);
                            props.imageName = varName;
                        }
                    }
                } else if (layer instanceof TextLayer) {
                    if (layer.font.name !== 'adafruit') {
                        const existingFontDeclaration = declarations.find(
                            (d) => d.type === 'font' && d.data.name === layer.font.name
                        );
                        if (!existingFontDeclaration) {
                            declarations.push({
                                type: 'font',
                                data: {
                                    name: layer.font.name,
                                    value: layer.font.title,
                                },
                            });
                        }
                    }
                }
                this.processLayerModifiers(layer, props);
                this.processVarDeclarations(layer, props, declarations);
                return props;
            });
        const source = this.templates[this.currentTemplate].template({
            declarations,
            layers: layerData,
            settings: Object.assign({}, this.settings, this.templates[this.currentTemplate].settings),
            packColor: (color) => this.packColor(color),
            defaultColor: this.features.defaultColor,
            clear_screen_method: this.getClearScreenMethod(this.features.screenBgColor),
            screenTitle: screenTitle ? toCppVariableName(screenTitle) : '',
        });
        return source;
    }

    getTextPosition(layer: any) {
        const font = getFont(layer.font);
        if (font instanceof GFXFont) {
            const baseHeight = font.fontData.meta.size.points * layer.scaleFactor;
            const yOffset = baseHeight - layer.bounds[3] + layer.scaleFactor;
            return [layer.position[0], layer.position[1] - layer.bounds[3] - yOffset];
        }
        return [layer.position[0], layer.position[1] - layer.bounds[3]];
    }
}
