import { getLayerProperties } from '../core/decorators/mapping';
import { AbstractImageLayer } from '../core/layers/abstract-image.layer';
import { AbstractLayer } from '../core/layers/abstract.layer';
import { TextLayer } from '../core/layers/text.layer';
import { bdfFonts } from '../draw/fonts/fontTypes';
import { imgDataToXBMP, toCppVariableName } from '../utils';
import { Platform } from './platform';
import defaultTemplate from './templates/embedded-graphics/default.pug';

type TEmbeddedGraphicsImports = {
    image: boolean;
    text: boolean;
    primitiveStyle: boolean;
    primitives: string[];
};

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
                preview_window: false,
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
        const templateSettings = Object.assign({}, this.settings, this.templates[this.currentTemplate].settings);

        if (templateSettings.preview_window) {
            templateSettings.include_images = true;
        }
        const layerData = layers
            .sort((a: AbstractLayer, b: AbstractLayer) => a.index - b.index)
            .map((layer) => {
                const props = getLayerProperties(layer);
                const functionName = this.getLayerFunctionName(layer, helperNames);
                if (layer instanceof AbstractImageLayer) {
                    const bitmap = imgDataToXBMP(layer.data, 0, 0, layer.size.x, layer.size.y, true).join(', ');

                    if (bitmaps.includes(bitmap)) {
                        props.imageName = bitmapNames[bitmaps.indexOf(bitmap)];
                    } else {
                        const name = layer.name ? this.toRustIdentifier(layer.name, 'image') : 'image';
                        const nameRegexp = new RegExp(`${name}_?\\d*`);
                        const countWithSameName = bitmapNames.filter((currentName) => nameRegexp.test(currentName)).length;
                        const suffix = countWithSameName || name === 'image' ? `_${countWithSameName}` : '';
                        const varName = `IMAGE_${(name + suffix).toUpperCase()}_BITS`;

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
                props.functionName = functionName;
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
            settings: templateSettings,
            screenTitle: screenTitle ? `_${this.toRustIdentifier(screenTitle, 'screen')}` : '',
            windowTitle: JSON.stringify(screenTitle || 'Graphics preview'),
            displayWidth: ctx?.canvas?.width ?? 128,
            displayHeight: ctx?.canvas?.height ?? 64,
            imports: this.getImports(layerData),
        });
    }

    packColor(color: string): string {
        return color === '#000000' || color === '0xFFFF' ? 'BinaryColor::Off' : 'BinaryColor::On';
    }

    private getLayerFunctionName(layer: AbstractLayer, helperNames: Set<string>): string {
        const baseName = this.toRustIdentifier(layer.name || `${layer.getType()}_${layer.uid || 'layer'}`, 'layer');
        let functionName = `draw_${baseName}`;
        let duplicateIndex = 1;

        while (helperNames.has(functionName)) {
            functionName = `draw_${baseName}_${duplicateIndex}`;
            duplicateIndex += 1;
        }

        helperNames.add(functionName);

        return functionName;
    }

    private toRustIdentifier(value: string, fallback: string): string {
        const normalized = toCppVariableName(value || fallback)
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toLowerCase();

        return normalized || fallback;
    }

    private getImports(layers: any[]): TEmbeddedGraphicsImports {
        const primitives = new Set<string>();
        let image = false;
        let text = false;

        for (const layer of layers) {
            switch (layer.type) {
                case 'line':
                    primitives.add('Line');
                    break;
                case 'rect':
                    primitives.add('Rectangle');
                    break;
                case 'circle':
                    primitives.add('Circle');
                    break;
                case 'ellipse':
                    primitives.add('Ellipse');
                    break;
                case 'triangle':
                    primitives.add('Triangle');
                    break;
                case 'polygon':
                    primitives.add('Polyline');
                    break;
                case 'paint':
                case 'icon':
                    image = true;
                    break;
                case 'string':
                    text = true;
                    break;
            }
        }

        return {
            image,
            text,
            primitiveStyle: primitives.size > 0,
            primitives: Array.from(primitives).sort(),
        };
    }
}