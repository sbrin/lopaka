import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {fontTypes} from '../draw/fonts/fontTypes';
import {imgDataToXBMP, packedHexColor, toCppVariableName} from '../utils';
import {Platform} from './platform';
import defaultTemplate from './templates/adafruit/default.pug';

export class AdafruitPlatform extends Platform {
    public static id = 'adafruit_gfx';
    protected name = 'Adafruit GFX';
    protected description = 'Adafruit GFX';
    protected fonts: TPlatformFont[] = [fontTypes['adafruit']];

    constructor() {
        super();
        this.features.hasCustomFontSize = true;
        this.features.hasRGBSupport = true;
        this.features.hasInvertedColors = true;
        this.features.defaultColor = '#FFFFFF';
    }

    protected templates = {
        Default: {
            template: defaultTemplate,
            settings: {}
        }
    };

    generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D): string {
        const declarations: {type: string; data: any}[] = [];
        const xbmps = [];
        const xbmpsNames = [];
        const layerData = layers
            .sort((a: AbstractLayer, b: AbstractLayer) => a.index - b.index)
            .map((layer) => {
                const props = layer.properties;
                if (layer instanceof AbstractImageLayer) {
                    const XBMP = imgDataToXBMP(layer.data, 0, 0, layer.size.x, layer.size.y, true).join(',');
                    if (xbmps.includes(XBMP)) {
                        props.imageName = xbmpsNames[xbmps.indexOf(XBMP)];
                    } else {
                        const varName = `image_${layer.imageName ? toCppVariableName(layer.imageName) : xbmps.length + 1}_bits`;
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
        return packedHexColor(color);
    }
}
