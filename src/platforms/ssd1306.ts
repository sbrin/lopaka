import {getLayerProperties} from '../core/decorators/mapping';
import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {TextLayer} from '../core/layers/text.layer';
import {bdfFonts} from '../draw/fonts/fontTypes';
import {imgDataToXBMP, toCppVariableName} from '../utils';
import {U8g2Parser} from './parsers/u8g2.parser';
import {Platform} from './platform';
import cEspIdfTemplate from './templates/u8g2/c_esp_idf.pug';
import defaultTemplate from './templates/ssd1306/default.pug';

export class SSD1306Platform extends Platform {
    public static id = 'ssd1306';
    protected name = 'SSD1306';
    protected description = 'SSD1306';
    protected fonts: TPlatformFont[] = [...bdfFonts];
    protected parser: U8g2Parser = new U8g2Parser();

    protected currentTemplate: string = 'arduino';

    protected templates = {
        arduino: {
            name: 'Arduino (Cpp)',
            template: defaultTemplate,
            settings: {
                progmem: true,
                wrap: false
            }
        }
    };

    constructor() {
        super();
        this.features.hasInvertedColors = true;
        this.features.defaultColor = '#FFFFFF';
    }

    generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D): string {
        const declarations: {type: string; data: any}[] = [];
        const xbmps = [];
        const xbmpsNames = [];
        const layerData = layers
            .sort((a: AbstractLayer, b: AbstractLayer) => a.index - b.index)
            .map((layer) => {
                const props = getLayerProperties(layer);
                if (layer instanceof AbstractImageLayer) {
                    const XBMP = imgDataToXBMP(layer.data, 0, 0, layer.size.x, layer.size.y).join(',');
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
                } else if (layer instanceof TextLayer) {
                    props.fontName = layer.font.name;
                }
                return props;
            });
        const source = this.templates[this.currentTemplate].template({
            declarations,
            layers: layerData,
            settings: Object.assign({}, this.settings, this.templates[this.currentTemplate].settings)
        });
        return source;
    }
}
