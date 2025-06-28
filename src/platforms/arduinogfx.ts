import {getLayerProperties} from '../core/decorators/mapping';
import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {fontTypes, gfxFonts} from '../draw/fonts/fontTypes';
import {imgDataToXBMP, packedHexColor565, toCppVariableName} from '../utils';
import {ArduinoGFXParser} from './parsers/arduinogfx.parser';
import {Platform} from './platform';
import defaultTemplate from './templates/arduinogfx/default.pug';
import {TextLayer} from '/src/core/layers/text.layer';
// https://github.com/moononournation/Arduino_GFX
export class ArduinoGFXPlatform extends Platform {
    public static id = 'arduino_gfx';
    protected name = 'ArduinoGFX Library';
    protected description = 'Arduino GFX Colored';
    protected fonts: TPlatformFont[] = [fontTypes['adafruit'], ...gfxFonts];
    protected parser: ArduinoGFXParser = new ArduinoGFXParser();

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
                comments: false,
            },
        },
    };

    generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D): string {
        const declarations: {type: string; data: any}[] = [];
        const xbmps = [];
        const xbmpsNames = [];
        const layerData = layers
            .sort((a: AbstractLayer, b: AbstractLayer) => a.index - b.index)
            .map((layer) => {
                const props = getLayerProperties(layer);
                if (layer instanceof AbstractImageLayer) {
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
                } else if (layer instanceof TextLayer && layer.font.name !== 'arduinogfx') {
                    declarations.push({
                        type: 'font',
                        data: {
                            name: layer.font.name,
                            value: layer.font.title,
                        },
                    });
                }
                return props;
            });
        const source = this.templates[this.currentTemplate].template({
            declarations,
            layers: layerData,
            settings: Object.assign({}, this.settings, this.templates[this.currentTemplate].settings),
            packColor: (color) => this.packColor(color),
            getTextPosition: (layer) => this.getTextPosition(layer),
            defaultColor: this.features.defaultColor,
        });
        return source;
    }

    protected getTextPosition(layer: any) {
        if (layer.font === 'arduinogfx') {
            return [layer.position[0], layer.position[1] - layer.bounds[3]];
        }
        return [layer.position[0], layer.position[1] - layer.scaleFactor];
    }

    protected packColor(color: string): string {
        return packedHexColor565(color);
    }
}
