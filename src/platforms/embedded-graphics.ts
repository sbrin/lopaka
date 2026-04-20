import { getLayerProperties } from '../core/decorators/mapping';
import { AbstractImageLayer } from '../core/layers/abstract-image.layer';
import { AbstractLayer } from '../core/layers/abstract.layer';
import { TextLayer } from '../core/layers/text.layer';
import { bdfFonts } from '../draw/fonts/fontTypes';
import { imgDataToXBMP, toCppVariableName } from '../utils';
import { Platform } from './platform';
import defaultTemplate from './templates/embedded-graphics/default.pug';

export class EmbeddedGraphicsPlatform extends Platform {
    public static id = 'embedded_graphics';
    protected name = 'embedded-graphics';
    protected description = 'Rust embedded-graphics';
    protected fonts: TPlatformFont[] = [bdfFonts.find((font) => font.name === '6x10') ?? bdfFonts[0]];
    protected parser = null;

    protected currentTemplate: string = 'default';

    protected templates = {
        default: {
            name: 'Rust',
            template: defaultTemplate,
            settings: {
                wrap: true,
                comments: false,
                declare_vars: true,
                include_images: true,
            },
        },
    };

    constructor() {
        super();
        Object.assign(this.features, {
            hasIndexedColors: true,
            hasRoundCorners: false,
            hasImages: true,
            defaultColor: '#FFFFFF',
            palette: ['#000000', '#FFFFFF'],
            screenBgColor: '#000000',
        });
    }

    generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D, screenTitle?: string): string {
        const declarations: { type: string; data: any }[] = [];
        const bitmaps: string[] = [];
        const bitmapNames: string[] = [];
        const helperNames = new Set<string>();
        const layerData = layers
            .sort((a: AbstractLayer, b: AbstractLayer) => a.index - b.index)
            .map((layer) => {
                const props = getLayerProperties(layer);
                props.functionName = this.getLayerFunctionName(layer, helperNames);
                if (layer instanceof AbstractImageLayer) {
                    const bitmap = imgDataToXBMP(layer.data, 0, 0, layer.size.x, layer.size.y, true).join(', ');

                    if (bitmaps.includes(bitmap)) {
                        props.imageName = bitmapNames[bitmaps.indexOf(bitmap)];
                    } else {
                        const name = layer.name ? toCppVariableName(layer.name) : 'paint';
                        const nameRegexp = new RegExp(`${name}_?\\d*`);
                        const countWithSameName = bitmapNames.filter((currentName) => nameRegexp.test(currentName)).length;
                        const varName = `image_${name + (countWithSameName || name === 'paint' ? `_${countWithSameName}` : '')
                            }_bits`;

                        declarations.push({
                            type: 'bitmap',
                            data: {
                                name: varName,
                                value: bitmap,
                            },
                        });
                        bitmaps.push(bitmap);
                        bitmapNames.push(varName);
                        props.imageName = varName;
                    }
                }
                this.processLayerModifiers(layer, props, {
                    x: (currentLayer: AbstractLayer, currentProps: any) => {
                        currentProps.x = currentLayer.position.x;
                    },
                    y: (currentLayer: AbstractLayer, currentProps: any) => {
                        if (currentLayer instanceof TextLayer) {
                            currentProps.y = this.getTextPosition(currentProps)[1];
                        } else {
                            currentProps.y = currentLayer.position.y;
                        }
                    },
                });
                if (typeof props.color === 'string') {
                    props.color = this.packColor(props.color);
                }
                props.declarations = this.processVarDeclarations(layer, props, []);
                if (layer.getType() === 'polygon') {
                    props.pointsVarName = `pts_${props.functionName.replace(/^draw_/, '')}`;
                }
                return props;
            });

        return this.templates[this.currentTemplate].template({
            declarations,
            layers: layerData,
            settings: Object.assign({}, this.settings, this.templates[this.currentTemplate].settings),
            screenTitle: screenTitle ? `_${toCppVariableName(screenTitle)}` : '',
        });
    }

    packColor(color: string): string {
        return color === '#000000' || color === '0xFFFF' ? 'BinaryColor::Off' : 'BinaryColor::On';
    }

    private getLayerFunctionName(layer: AbstractLayer, helperNames: Set<string>): string {
        const baseName = toCppVariableName(layer.name || `${layer.getType()}_${layer.uid || 'layer'}`) || 'layer';
        let functionName = `draw_${baseName}`;
        let duplicateIndex = 1;

        while (helperNames.has(functionName)) {
            functionName = `draw_${baseName}_${duplicateIndex}`;
            duplicateIndex += 1;
        }

        helperNames.add(functionName);

        return functionName;
    }
}