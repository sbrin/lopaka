import {getImageList, getImageData} from './image-files';
import {TextLayer} from '../core/layers/text.layer';
import {getLayerProperties} from '../core/decorators/mapping';
import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {FontFormat} from '../draw/fonts/font';
import {bdfFonts} from '../draw/fonts/fontTypes';
import {toCppVariableName} from '../utils';
import {FlipperParser} from './parsers/flipper.parser';
import {Platform} from './platform';
import defaultTemplate from './templates/flipper/default.pug';
import {Point} from '/src/core/point';

export const flipperOldFontNames = {
    haxrcorp4089_tr: 'FontSecondary',
    helvB08_tr: 'FontPrimary',
    profont22_tr: 'FontBigNumbers',
    haxrcorp4089: 'FontSecondary',
    helvB08: 'FontPrimary',
    profont22: 'FontBigNumbers',
};

export class FlipperPlatform extends Platform {
    public static id = 'flipper';
    protected name = 'Flipper Zero, One';
    protected description = 'Flipper Zero, One';
    protected parser: FlipperParser = new FlipperParser();

    protected fonts: TPlatformFont[] = [
        {
            title: 'FontPrimary',
            name: 'FontPrimary',
            file: bdfFonts.find((f) => f.name === 'helvB08').file,
            format: FontFormat.FORMAT_BDF,
        },
        {
            title: 'FontSecondary',
            name: 'FontSecondary',
            file: bdfFonts.find((f) => f.name === 'haxrcorp4089').file,
            format: FontFormat.FORMAT_BDF,
        },
        {
            title: 'FontKeyboard',
            name: 'FontKeyboard',
            file: bdfFonts.find((f) => f.name === 'profont11').file,
            format: FontFormat.FORMAT_BDF,
        },
        {
            title: 'FontBigNumbers',
            name: 'FontBigNumbers',
            file: bdfFonts.find((f) => f.name === 'profont22').file,
            format: FontFormat.FORMAT_BDF,
        },
    ];
    public displays = [
        {title: 'Zero Horizontal (128×64)', size: new Point(128, 64)},
        {title: 'Zero Vertical (64×128)', size: new Point(64, 128)},
        {title: 'One Horizontal (256×144)', size: new Point(256, 144)},
        {title: 'One Vertical (144×256)', size: new Point(144, 256)},
    ];
    constructor() {
        super();
        Object.assign(this.features, {
            hasInvertedColors: true,
            defaultColor: '#000000',
            screenBgColor: '#ff8200',
            interfaceColors: {
                selectColor: 'rgba(255, 255, 255, 0.9)',
                resizeIconColor: 'rgba(255, 255, 255, 0.6)',
                hoverColor: 'rgba(255, 255, 255, 0.5)',
                rulerColor: 'rgba(255, 255, 255, 0.5)',
                rulerLineColor: '#955B2F',
                selectionStrokeColor: 'rgba(255, 255, 255, 0.9)',
            },
        });
    }

    protected templates = {
        Default: {
            template: defaultTemplate,
            settings: {
                wrap: true,
                declare_vars: true,
                include_images: true,
                export_images: false,
                comments: true,
            },
        },
    };

    generateSourceCode(
        layers: AbstractLayer[],
        ctx?: OffscreenCanvasRenderingContext2D,
        screenTitle?: string
    ): string {
        const settings = Object.assign({}, this.settings, this.templates[this.currentTemplate].settings);
        const images = getImageList(layers, 'flipper');
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
                                value: settings.export_images ? '' : getImageData(image, 'flipper', this.features.screenBgColor),
                            },
                        });
                    }
                } else if (layer instanceof TextLayer) {
                    props.fontName = flipperOldFontNames[layer.font.name] ?? layer.font.name;
                }
                this.processLayerModifiers(layer, props);
                this.processVarDeclarations(layer, props, declarations);
                return props;
            });
        const source = this.templates[this.currentTemplate].template({
            declarations,
            layers: layerData,
            settings,
            screenTitle: screenTitle ? toCppVariableName(screenTitle) : '',
        });
        return source;
    }
    getTextPosition(layer: TextLayer) {
        return [layer.position[0], layer.position[1]];
    }
}
