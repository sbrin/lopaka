import {getLayerProperties} from '../core/decorators/mapping';
import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {FontFormat} from '../draw/fonts/font';
import {bdfFonts} from '../draw/fonts/fontTypes';
import {imgDataToXBMP} from '../utils';
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

    constructor() {
        super();
        this.features.hasInvertedColors = false;
        this.features.defaultColor = '#000000';
        this.features.screenBgColor = '#ff8200';
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
                const props = getLayerProperties(layer);
                if (layer instanceof AbstractImageLayer && !layer.imageName) {
                    const XBMP = imgDataToXBMP(layer.data, 0, 0, layer.size.x, layer.size.y).join(',');
                    if (xbmps.includes(XBMP)) {
                        props.imageName = xbmpsNames[xbmps.indexOf(XBMP)];
                    } else {
                        const varName = `image_${xbmps.length + 1}_bits`;
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
            settings: Object.assign({}, this.settings, this.templates[this.currentTemplate].settings)
        });
        return source;
    }
}
