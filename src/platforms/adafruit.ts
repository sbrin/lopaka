import {getLayerProperties} from '../core/decorators/mapping';
import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {adafruitFonts, gfxFonts} from '../draw/fonts/fontTypes';
import {imgDataToRGB565, imgDataToXBMP, packedHexColor565, toCppVariableName} from '../utils';
import {AdafruitParser} from './parsers/adafruit.parser';
import {Platform} from './platform';
import defaultTemplate from './templates/adafruit/default.pug';
import {CircleLayer} from '/src/core/layers/circle.layer';
import {EllipseLayer} from '/src/core/layers/ellipse.layer';
import {LineLayer} from '/src/core/layers/line.layer';
import {RectangleLayer} from '/src/core/layers/rectangle.layer';
import {TextLayer} from '/src/core/layers/text.layer';
import {PlatformTemplates} from '/src/types';

const layerProps = ['x', 'y', 'w', 'h', 'radius', 'x1', 'y1', 'x2', 'y2', 'fontSize', 'text'];

export class AdafruitPlatform extends Platform {
    public static id = 'adafruit_gfx';
    protected name = 'AdafruitGFX Color';
    protected description = 'Adafruit GFX Colored';
    protected fonts: TPlatformFont[] = [adafruitFonts['adafruit'], ...gfxFonts];
    protected parser: AdafruitParser = new AdafruitParser();

    constructor() {
        super();
        // no RGB image support but has all colours
        this.features.hasIndexedColors = true;
        this.features.hasCustomFontSize = true;
        this.features.defaultColor = '#FFFFFF';
    }

    protected templates: PlatformTemplates = {
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
                        const bitmap565 = imgDataToRGB565(layer.data, 0, 0, layer.size.x, layer.size.y).join(',');
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
                        declarations.push({
                            type: 'font',
                            data: {
                                name: layer.font.name,
                                value: layer.font.title,
                            },
                        });
                    }
                }
                const overrides = {
                    y: (layer: AbstractLayer, props: any) => {
                        if (layer instanceof CircleLayer) {
                            props.y = layer.position.y + layer.radius;
                        } else if (layer instanceof TextLayer) {
                            props.y = this.getTextPosition(props)[1];
                        } else {
                            props.y = layer.position.y;
                        }
                    },
                    color: (layer: AbstractLayer, props: any) => {
                        props.color = this.packColor(layer.color);
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
            clear_screen_method: this.getClearScreenMethod(this.features.screenBgColor),
            screenTitle: screenTitle ? toCppVariableName(screenTitle) : '',
        });
        return source;
    }

    getTextPosition(layer: any) {
        if (layer.font === 'adafruit') {
            return [layer.position[0], layer.position[1] - layer.bounds[3]];
        }
        return [layer.position[0], layer.position[1] - layer.scaleFactor];
    }

    packColor(color: string): string {
        return packedHexColor565(color);
    }
}
