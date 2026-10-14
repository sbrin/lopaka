import {inlineImage, type ImageDeclaration} from './image-files';
import {getLayerProperties} from '../core/decorators/mapping';
import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {TextLayer} from '../core/layers/text.layer';
import {ttfFonts} from '../draw/fonts/fontTypes';
import {toCppVariableName} from '../utils';
import {Platform} from './platform';
import defaultTemplate from './templates/esphome/default.pug';
import {EsphomeParser} from './parsers/esphome.parser';
import {PlatformTemplates} from '/src/types';

export class EsphomePlatform extends Platform {
    public static id = 'esphome';
    protected name = 'ESPHome';
    protected description = 'ESPHome Display Component';
    protected fonts: TPlatformFont[] = [...ttfFonts];
    protected parser: EsphomeParser = new EsphomeParser();

    protected currentTemplate: string = 'default';

    protected templates: PlatformTemplates = {
        default: {
            name: 'ESPHome',
            template: defaultTemplate,
            settings: {
                wrap: true,
                comments: true,
                include_fonts: true,
                include_images: true,
                export_images: false,
                declare_vars: true,
            },
        },
    };

    constructor() {
        super();
        this.features.hasCustomFontSize = true;
        this.features.hasRGBSupport = true;
        this.features.defaultColor = '#FFFFFF';
        this.features.screenBgColor = '#000000';
        this.features.hasRoundCorners = false;
    }

    protected processVarDeclarations(layer: AbstractLayer, props: any, declarations: {type: string; data: any}[]) {
        const isDeclarationsEnabled = this.getTemplateSettings()['declare_vars'];
        Object.keys(layer.variables).forEach((name) => {
            if (layer.variables[name]) {
                const varName = isDeclarationsEnabled
                    ? toCppVariableName(`${layer.name}_${name}`)
                    : `id(${toCppVariableName(layer.name + '_' + name)})`;
                declarations.push({
                    type: 'var',
                    data: {
                        name: varName,
                        value: props[name],
                        type: layer.modifiers[name].type,
                    },
                });
                props[name] = varName;
                if (name === 'text') {
                    props.isTextVariable = true;
                }
            }
        });
        return declarations.sort((a, b) => a.data.name.localeCompare(b.data.name));
    }

    generateSourceCode(
        layers: AbstractLayer[],
        ctx?: OffscreenCanvasRenderingContext2D,
        screenTitle?: string,
        imageDeclaration: ImageDeclaration = inlineImage
    ): string {
        const declarations: {type: string; data: any}[] = [];
        const imageKeys = [];
        const imageNames = [];
        const layerData = layers
            .sort((a: AbstractLayer, b: AbstractLayer) => a.index - b.index)
            .map((layer) => {
                const props = getLayerProperties(layer);
                if (layer instanceof AbstractImageLayer) {
                    const imageKey = `${layer.size.x}x${layer.size.y}:` + Array.from(layer.data.data).join(',');
                    if (imageKeys.includes(imageKey)) {
                        props.imageName = imageNames[imageKeys.indexOf(imageKey)];
                    } else {
                        const baseName = 'img_' + toCppVariableName(layer.imageName ?? layer.name);
                        let name = baseName;
                        let suffix = 2;
                        while (imageNames.includes(name)) name = baseName + '_' + suffix++;
                        declarations.push({
                            type: 'bitmap',
                            data: {
                                name: name,
                                value: layer.imageName ?? toCppVariableName(layer.name),
                                file: imageDeclaration(name, `images/${layer.imageName ?? toCppVariableName(layer.name)}.png`, layer.data),
                                size: layer.size.x + 'x' + layer.size.y,
                            },
                        });
                        imageKeys.push(imageKey);
                        imageNames.push(name);
                        props.imageName = name;
                    }
                } else if (layer instanceof TextLayer) {
                    // ESPHome uses system fonts or custom fonts defined in the YAML config
                    const baseFontName = toCppVariableName(layer.font.name);
                    const hasMultipleSizes = declarations.some(
                        (d) =>
                            d.type === 'font' && d.data.value === layer.font.name && d.data.size !== layer.scaleFactor
                    );
                    props.fontName = hasMultipleSizes ? baseFontName + '_' + layer.scaleFactor : baseFontName;
                    const fontName = props.fontName;
                    if (!declarations.some((d) => d.type === 'font' && d.data.name === fontName)) {
                        declarations.push({
                            type: 'font',
                            data: {
                                name: fontName,
                                value: layer.font.name,
                                size: layer.scaleFactor,
                                format: layer.font.format,
                            },
                        });
                    }
                }
                const overrides = {
                    color: (layer: AbstractLayer, props: any) => {
                        props.color = `Color(${parseInt(layer.color.substring(1, 3), 16)}, ${parseInt(layer.color.substring(3, 5), 16)}, ${parseInt(layer.color.substring(5, 7), 16)})`;
                    },
                };

                this.processLayerModifiers(layer, props, overrides);
                this.processVarDeclarations(layer, props, declarations);
                return props;
            });
        const source = this.templates[this.currentTemplate].template({
            imageDeclaration,
            declarations,
            layers: layerData,
            settings: Object.assign({}, this.settings, this.templates[this.currentTemplate].settings),
            screenBgColor: this.features.screenBgColor,
            screenTitle: screenTitle ? toCppVariableName(screenTitle) : '',
        });
        return source;
    }
}
