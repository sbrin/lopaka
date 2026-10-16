import {getImageList, getImageData} from './image-files';
import {getLayerProperties} from '/src/core/decorators/mapping';
import {AbstractImageLayer} from '/src/core/layers/abstract-image.layer';
import {AbstractLayer} from '/src/core/layers/abstract.layer';
import {adafruitFonts, gfxFonts} from '../draw/fonts/fontTypes';
import {toCppVariableName} from '../utils';
import {Platform} from './platform';
import defaultTemplate from './templates/tft-espi/default.pug';
import {getFont} from '../draw/fonts';
import {GFXFont} from '../draw/fonts/gfx.font';
import {AbstractParser} from './parsers/abstract-parser';
import {TFTeSPIParser} from './parsers/tft-espi.parser';
import {TextLayer} from '/src/core/layers/text.layer';

export class TFTeSPIPlatform extends Platform {
    public static id = 'tft-espi';
    protected name = 'TFT_eSPI, M5, Lovyan';
    protected description = 'TFT_eSPI';
    protected fonts: TPlatformFont[] = [adafruitFonts['adafruit'], ...gfxFonts];
    protected parser: AbstractParser = new TFTeSPIParser();

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
                wrap: true,
                include_fonts: true,
                include_images: true,
                export_images: false,
                declare_vars: true,
                comments: true,
                clear_screen: true,
            },
        },
    };

    generateSourceCode(
        layers: AbstractLayer[],
        ctx?: OffscreenCanvasRenderingContext2D,
        screenTitle?: string
    ): string {
        const settings = Object.assign({}, this.settings, this.templates[this.currentTemplate].settings);
        const images = getImageList(layers, 'tft-espi');
        const declarations: {type: string; data: any}[] = [];
        const layerData = layers
            .sort((a: AbstractLayer, b: AbstractLayer) => a.index - b.index)
            .map((layer) => {
                const props = getLayerProperties(layer);
                if (layer instanceof AbstractImageLayer) {
                    const image = images.find((image) => image.layers.includes(layer));
                    if (!image) return props;
                    props.imageName = image.name;
                    if (!declarations.some((decl) => decl.data.name === image.name)) {
                        declarations.push({
                            type: image.type,
                            data: {
                                name: image.name,
                                filename: image.filename,
                                value: settings.export_images ? '' : getImageData(image, 'tft-espi', this.features.screenBgColor),
                            },
                        });
                    }
                } else if (layer instanceof TextLayer) {
                    if (layer.font.name !== 'adafruit') {
                        const existingFontDeclaration = declarations.find(
                            (d) => d.type === 'font' && d.data.name === layer.font.name
                        );
                        if (!existingFontDeclaration) {
                            declarations.push({
                                type: 'font',
                                data: {
                                    name: layer.font.name,
                                    value: layer.font.title,
                                },
                            });
                        }
                    }
                }
                this.processLayerModifiers(layer, props);
                this.processVarDeclarations(layer, props, declarations);
                return props;
            });
        const source = this.templates[this.currentTemplate].template({
            declarations,
            layers: layerData,
            settings,
            packColor: (color) => this.packColor(color),
            defaultColor: this.features.defaultColor,
            clear_screen_method: this.getClearScreenMethod(this.features.screenBgColor),
            screenTitle: screenTitle ? toCppVariableName(screenTitle) : '',
        });
        return source;
    }

    getTextPosition(layer: any) {
        const font = getFont(layer.font);
        if (font instanceof GFXFont) {
            const baseHeight = font.fontData.meta.size.points * layer.scaleFactor;
            const yOffset = baseHeight - layer.bounds[3] + layer.scaleFactor;
            return [layer.position[0], layer.position[1] - layer.bounds[3] - yOffset];
        }
        return [layer.position[0], layer.position[1] - layer.bounds[3]];
    }
}
