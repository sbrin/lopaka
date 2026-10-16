import {getImageList, getImageData} from './image-files';
import {getLayerProperties} from '../core/decorators/mapping';
import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {adafruitFonts, gfxFonts} from '../draw/fonts/fontTypes';
import {packedHexColor565, toCppVariableName} from '../utils';
import {ArduinoGFXParser} from './parsers/arduinogfx.parser';
import {Platform} from './platform';
import defaultTemplate from './templates/arduinogfx/default.pug';
import {TextLayer} from '/src/core/layers/text.layer';
import {PlatformTemplates} from '/src/types';

// https://github.com/moononournation/Arduino_GFX
export class ArduinoGFXPlatform extends Platform {
    public static id = 'arduino_gfx';
    protected name = 'ArduinoGFX';
    protected description = 'ArduinoGFX';
    protected fonts: TPlatformFont[] = [adafruitFonts['adafruit'], ...gfxFonts];
    protected parser: ArduinoGFXParser = new ArduinoGFXParser();

    constructor() {
        super();
        this.features.hasCustomFontSize = true;
        this.features.hasRGBSupport = true;
        this.features.defaultColor = '#FFFFFF';
    }

    protected templates: PlatformTemplates = {
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
        const images = getImageList(layers, 'arduino_gfx');
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
                                value: settings.export_images ? '' : getImageData(image, 'arduino_gfx', this.features.screenBgColor),
                            },
                        });
                    }
                } else if (layer instanceof TextLayer) {
                    if (layer.font.name !== 'adafruit') {
                        declarations.push({
                            type: 'font',
                            data: {
                                name: layer.font.name,
                                value: layer.font.title,
                            },
                        });
                    }
                }
                const overrides = {
                    y: (layer: AbstractLayer, props: any) => {
                        if (layer instanceof TextLayer) {
                            props.y = this.getTextPosition(props)[1];
                        } else {
                            props.y = layer.position.y;
                        }
                    },
                    color: (layer: AbstractLayer, props: any) => {
                        props.color = this.packColor(layer.color);
                    },
                };
                this.processLayerModifiers(layer, props, overrides);
                this.processVarDeclarations(layer, props, declarations);
                return props;
            });
        const source = this.templates[this.currentTemplate].template({
            declarations,
            layers: layerData,
            settings,
            defaultColor: this.packColor(this.features.defaultColor),
            clear_screen_method: this.getClearScreenMethod(this.features.screenBgColor),
            screenTitle: screenTitle ? toCppVariableName(screenTitle) : '',
            packColor: this.packColor.bind(this),
        });
        return source;
    }

    getTextPosition(layer: any) {
        if (layer.font === 'adafruit') {
            return [layer.position[0], layer.position[1] - layer.bounds[3]];
        }
        return [layer.position[0], layer.position[1] - layer.scaleFactor];
    }

    packColor(color: string): string {
        return packedHexColor565(color);
    }
}
