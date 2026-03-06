import {getLayerProperties} from '../core/decorators/mapping';
import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {TextLayer} from '../core/layers/text.layer';
import {gfxFonts} from '../draw/fonts/fontTypes';
import {imgDataToBuffer, imgDataToXBMP, toCppVariableName} from '../utils';
// import {U8g2Parser} from './parsers/u8g2.parser';
import {Platform} from './platform';
import defaultTemplate from './templates/micropython/default.pug';
import {MicropythonParser} from '/src/platforms/parsers/micropython.parser';

export class MicropythonPlatform extends Platform {
    public static id = 'micropython';
    protected name = 'Micropython';
    protected description = 'Micropython';
    protected fonts: TPlatformFont[] = [gfxFonts.find((f) => f.name === 'Petme8x8')];
    protected parser: MicropythonParser = new MicropythonParser();

    protected currentTemplate: string = 'default';

    protected templates = {
        default: {
            name: 'Micropython',
            template: defaultTemplate,
            settings: {
                wrap: true,
                comments: false,
                include_images: true,
                declare_vars: true,
            },
        },
    };

    constructor() {
        super();
        this.features.hasRoundCorners = false;
        this.features.hasFonts = false;
        this.features.hasInvertedColors = false;
        this.features.hasIndexedColors = true;
        this.features.defaultColor = '#FFFFFF';
        this.features.palette = ['#000000', '#ffffff'];
        this.features.screenBgColor = '#000000';
    }

    generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D, screenTitle?: string): string {
        const declarations: {type: string; data: any}[] = [];
        const xbmps = [];
        const xbmpsNames = [];
        const layerData = layers
            .sort((a: AbstractLayer, b: AbstractLayer) => a.index - b.index)
            .map((layer) => {
                const props = getLayerProperties(layer);
                if (layer instanceof AbstractImageLayer) {
                    const XBMP = imgDataToBuffer(layer.data, 0, 0, layer.size.x, layer.size.y);

                    if (xbmps.includes(XBMP)) {
                        props.imageName = xbmpsNames[xbmps.indexOf(XBMP)];
                    } else {
                        const name = layer.name ? toCppVariableName(layer.name) : 'paint';
                        const nameRegexp = new RegExp(`${name}_?\d*`);
                        const countWithSameName = xbmpsNames.filter((n) => nameRegexp.test(n)).length;
                        const varName = `image_${name + (countWithSameName || name == 'paint' ? `_${countWithSameName}` : '')}_bits`;
                        declarations.push({
                            type: 'bitmap',
                            data: {
                                name: varName,
                                value: XBMP,
                            },
                        });
                        xbmps.push(XBMP);
                        xbmpsNames.push(varName);
                        props.imageName = varName;
                    }
                }
                this.processLayerModifiers(layer, props);
                this.processVarDeclarations(layer, props, declarations);
                return props;
            });
        const source = this.templates[this.currentTemplate].template({
            declarations,
            layers: layerData,
            settings: Object.assign({}, this.settings, this.templates[this.currentTemplate].settings),
            screenTitle: screenTitle ? toCppVariableName(screenTitle) : '',
        });
        return source;
    }
    packColor(color: string): string {
        if (color === '#000000' || color === '0xFFFF') return '0';
        return '1';
    }
}
