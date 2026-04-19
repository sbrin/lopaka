import { getLayerProperties } from '../core/decorators/mapping';
import { AbstractLayer } from '../core/layers/abstract.layer';
import { TextLayer } from '../core/layers/text.layer';
import { bdfFonts } from '../draw/fonts/fontTypes';
import { toCppVariableName } from '../utils';
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
            },
        },
    };

    constructor() {
        super();
        Object.assign(this.features, {
            hasIndexedColors: true,
            hasRoundCorners: false,
            hasImages: false,
            defaultColor: '#FFFFFF',
            palette: ['#000000', '#FFFFFF'],
            screenBgColor: '#000000',
        });
    }

    generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D, screenTitle?: string): string {
        const declarations: { type: string; data: any }[] = [];
        const layerData = layers
            .sort((a: AbstractLayer, b: AbstractLayer) => a.index - b.index)
            .map((layer) => {
                const props = getLayerProperties(layer);
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
                this.processVarDeclarations(layer, props, declarations);
                if (layer.getType() === 'polygon') {
                    props.pointsVarName = `pts_${toCppVariableName(layer.uid || layer.name || 'polygon')}`;
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
}