import { getLayerProperties } from "../core/decorators/mapping";
import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {fontTypes} from '../draw/fonts/fontTypes';
import {imgDataToXBMP, packedHexColor565, toCppVariableName} from '../utils';
import {Platform} from './platform';
import defaultTemplate from './templates/tft-espi/default.pug';

export class TFTeSPIPlatform extends Platform {
    public static id = 'tft-espi';
    protected name = 'TFT_eSPI';
    protected description = 'TFT_eSPI';
    protected fonts: TPlatformFont[] = [fontTypes['adafruit']];

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
                wrap: false
            }
        }
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
                        const name = layer.imageName ? toCppVariableName(layer.imageName) : 'paint';
                        const nameRegexp = new RegExp(`${name}_?\d*`);
                        const countWithSameName = xbmpsNames.filter((n) => nameRegexp.test(n)).length;
                        const varName = `image_${name + (countWithSameName || name == 'paint' ? `_${countWithSameName}` : '')}_bits`;
                        declarations.push({
                            type: 'bitmap',
                            data: {
                                name: varName,
                                value: XBMP
                            }
                        });
                        xbmps.push(XBMP);
                        xbmpsNames.push(varName);
                        props.imageName = varName;
                    }
                }
                return props;
            });
        const source = this.templates[this.currentTemplate].template({
            declarations,
            layers: layerData,
            settings: Object.assign({}, this.settings, this.templates[this.currentTemplate].settings),
            packColor: (color) => this.packColor(color)
        });
        return source;
    }
    protected packColor(color: string): string {
        return packedHexColor565(color);
    }
}
