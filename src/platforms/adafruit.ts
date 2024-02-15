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
        Default: defaultTemplate
    };

    generateSourceCode(templateName: string, layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D): string {
        const declarations: string[] = [];

        const layerData = layers
            .sort((a: AbstractLayer, b: AbstractLayer) => a.index - b.index)
            .map((layer) => {
                const props = layer.properties;
                if (layer instanceof AbstractImageLayer) {
                    const XBMP = imgDataToXBMP(layer.data, 0, 0, layer.size.x, layer.size.y, true);
                    const varName = `image_${toCppVariableName(layer.name)}_bits`;
                    const varDeclaration = `static const unsigned char PROGMEM ${varName}[] = {${XBMP}};`;
                    if (!declarations.includes(varDeclaration)) {
                        declarations.push(varDeclaration);
                    }
                    props.imageName = varName;
                }
                return props;
            });
        const source = this.templates[templateName]({
            declarations,
            layers: layerData,
            settings: this.settings,
            packColor: (color) => this.packColor(color)
        });
        return source;
    }
    protected packColor(color: string): string {
        return packedHexColor(color);
    }
}
