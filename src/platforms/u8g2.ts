import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {TextLayer} from '../core/layers/text.layer';
import {bdfFonts} from '../draw/fonts/fontTypes';
import {imgDataToXBMP, toCppVariableName} from '../utils';
import {Platform} from './platform';
import defaultTemplate from './templates/u8g2/default.pug';
import cEspIdfTemplate from './templates/u8g2/c_esp_idf.pug';

// for backwards compatibility
// TODO: remove after 15.04.2024
const oldFontNames = {
    f4x6_tr: '4x6',
    '5x8_tr': '5x8',
    haxrcorp4089_tr: 'haxcorp4089',
    helvB08_tr: 'helvb08',
    '6x10_tr': '6x10',
    profont22_tr: 'profont22'
};

export class U8g2Platform extends Platform {
    public static id = 'u8g2';
    protected name = 'U8g2';
    protected description = 'U8g2';
    protected fonts: TPlatformFont[] = [...bdfFonts];

    protected templates = {
        Default: defaultTemplate,
        CStyle: cEspIdfTemplate
    };

    constructor() {
        super();
        this.features.hasInvertedColors = true;
        this.features.defaultColor = '#FFFFFF';
    }

    generateSourceCode(templateName: string, layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D): string {
        const declarations: string[] = [];
        const xbmps = [];
        const xbmpsNames = [];
        const layerData = layers
            .sort((a: AbstractLayer, b: AbstractLayer) => a.index - b.index)
            .map((layer) => {
                const props = layer.properties;
                if (layer instanceof AbstractImageLayer) {
                    const XBMP = imgDataToXBMP(layer.data, 0, 0, layer.size.x, layer.size.y).join(',');
                    if (xbmps.includes(XBMP)) {
                        props.imageName = xbmpsNames[xbmps.indexOf(XBMP)];
                    } else {
                        const varName = `image_${layer.imageName ? toCppVariableName(layer.imageName) : xbmps.length + 1}_bits`;
                        const varDeclaration = `static const unsigned char ${varName}[] U8X8_PROGMEM = {${XBMP}};`;
                        declarations.push(varDeclaration);
                        xbmps.push(XBMP);
                        xbmpsNames.push(varName);
                        props.imageName = varName;
                    }
                } else if (layer instanceof TextLayer) {
                    const fontName = `u8g2_font_${oldFontNames[layer.font.name] ?? layer.font.name}`;
                    props.fontName = `${fontName}_tr`;
                }
                return props;
            });
        const source = this.templates[templateName]({
            declarations,
            layers: layerData,
            settings: this.settings
        });
        return source;
    }
}
