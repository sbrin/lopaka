import {getLayerProperties} from '../core/decorators/mapping';
import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {Point} from '../core/point';
import {fontTypes} from '../draw/fonts/fontTypes';
import {imgDataToXBMP, packedHexColor565, toCppVariableName} from '../utils';
import {AdafruitParser} from './parsers/adafruit.parser';
import {Platform} from './platform';
import defaultTemplate from './templates/adafruit/default.pug';

export class AdafruitPlatform extends Platform {
    public static id = 'adafruit_gfx';
    protected name = 'Adafruit GFX';
    protected description = 'Adafruit GFX';
    protected fonts: TPlatformFont[] = [fontTypes['adafruit']];
    protected parser: AdafruitParser = new AdafruitParser();

    protected displays = [
        {title: '2', size: new Point(202, 104)},
        {title: '6COLOR', size: new Point(600, 448)},
        {title: '4TEMPERA', size: new Point(600, 600)},
        {title: '6', size: new Point(800, 600)},
        {title: '5', size: new Point(960, 540)},
        {title: '6PLUS', size: new Point(1024, 758)},
        {title: '10', size: new Point(1200, 825)}
    ];

    constructor() {
        super();
        this.features.hasCustomFontSize = true;
        this.features.hasRGBSupport = true;
        // this.features.hasInvertedColors = true;
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
