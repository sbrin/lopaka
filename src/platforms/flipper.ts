import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {FontFormat} from '../draw/fonts/font';
import {bdfFonts} from '../draw/fonts/fontTypes';
import {imgDataToXBMP, toCppVariableName} from '../utils';
import {Platform} from './platform';
import defaultTemplate from './templates/flipper/default.pug';

export class FlipperPlatform extends Platform {
    public static id = 'flipper';
    protected name = 'Flipper Zero';
    protected description = 'Flipper Zero';
    protected fonts: TPlatformFont[] = [
        {
            title: 'FontPrimary',
            name: 'FontPrimary',
            file: bdfFonts.find((f) => f.name === 'helvB08').file,
            format: FontFormat.FORMAT_BDF
        },
        {
            title: 'FontSecondary',
            name: 'FontSecondary',
            file: bdfFonts.find((f) => f.name === 'haxrcorp4089').file,
            format: FontFormat.FORMAT_BDF
        },
        {
            title: 'FontKeyboard',
            name: 'FontKeyboard',
            file: bdfFonts.find((f) => f.name === 'profont11').file,
            format: FontFormat.FORMAT_BDF
        },
        {
            title: 'FontBigNumbers',
            name: 'FontBigNumbers',
            file: bdfFonts.find((f) => f.name === 'profont22').file,
            format: FontFormat.FORMAT_BDF
        }
    ];

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
                    const XBMP = imgDataToXBMP(layer.data, 0, 0, layer.size.x, layer.size.y);
                    const varName = `image_${toCppVariableName(layer.name)}_bits`;
                    const varDeclaration = `const uint8_t ${varName}[] = {${XBMP}};`;
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
            settings: this.settings
        });
        return source;
    }
}
