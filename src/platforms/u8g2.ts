import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {TextLayer} from '../core/layers/text.layer';
import {bdfFonts} from '../draw/fonts/fontTypes';
import {imgDataToXBMP, toCppVariableName, xbmpToImgData} from '../utils';
import {Platform} from './platform';
import defaultTemplate from './templates/u8g2/default.pug';
import cEspIdfTemplate from './templates/u8g2/c_esp_idf.pug';
import {PaintLayer} from '../core/layers/paint.layer';
import {Point} from '../core/point';
import {LineLayer} from '../core/layers/line.layer';
import {RectangleLayer} from '../core/layers/rectangle.layer';
import {getFont, loadFont} from '../draw/fonts';
import {CircleLayer} from '../core/layers/circle.layer';
import {DotLayer} from '../core/layers/dot.layer';
import {EllipseLayer} from '../core/layers/ellipse.layer';
import {getLayerProperties} from '../core/decorators/mapping';

// for backwards compatibility
// TODO: remove after 15.04.2024
const oldFontNames = {
    f4x6_tr: '4x6',
    '5x8_tr': '5x8',
    haxrcorp4089_tr: 'haxcorp4089',
    helvB08_tr: 'helvb08',
    '6x10_tr': '6x10',
    profont22_tr: 'profont22'
};

export class U8g2Platform extends Platform {
    public static id = 'u8g2';
    protected name = 'U8g2';
    protected description = 'U8g2';
    protected fonts: TPlatformFont[] = [...bdfFonts];

    protected currentTemplate: string = 'arduino';

    protected templates = {
        arduino: {
            name: 'Arduino (Cpp)',
            template: defaultTemplate,
            settings: {
                progmem: true,
                wrap: false
            }
        },
        'esp-idf': {
            name: 'ESP-IDF (C)',
            template: cEspIdfTemplate,
            settings: {
                wrap: false
            }
        }
    };

    constructor() {
        super();
        this.features.hasInvertedColors = true;
        this.features.defaultColor = '#FFFFFF';
    }

    generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D): string {
        const declarations: {type: string; data: any}[] = [];
        const xbmps = [];
        const xbmpsNames = [];
        const layerData = layers
            .sort((a: AbstractLayer, b: AbstractLayer) => a.index - b.index)
            .map((layer) => {
                const props = getLayerProperties(layer);
                if (layer instanceof AbstractImageLayer) {
                    const XBMP = imgDataToXBMP(layer.data, 0, 0, layer.size.x, layer.size.y).join(',');
                    if (xbmps.includes(XBMP)) {
                        props.imageName = xbmpsNames[xbmps.indexOf(XBMP)];
                    } else {
                        const name = layer.imageName ? toCppVariableName(layer.imageName) : 'paint';
                        const nameRegexp = new RegExp(`${name}_?\d*`);
                        const countWithSameName = xbmpsNames.filter((n) => nameRegexp.test(n)).length;
                        const varName = `image_${name + (countWithSameName || name == 'paint' ? `_${countWithSameName}` : '')}_bits`;
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
                } else if (layer instanceof TextLayer) {
                    const fontName = `u8g2_font_${oldFontNames[layer.font.name] ?? layer.font.name}`;
                    props.fontName = `${fontName}_tr`;
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

    // TODO: move parser to a separate class
    importSourceCode(sourceCode: string): AbstractLayer[] {
        const variablesRegex = /(\w+)\s+(\w+)(\[\d+\])?(\s*=\s*([^;]+))?;/gm;
        const definesRegex = /#define\s+([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)/gm;
        const declarationsRegex = /char\s+([a-zA-Z0-9_]+)\[\]\s*([\w\d_]*PROGMEM)?\s*=\s+\{([^}]+)\};/gm;
        const cppMethodsRegexp = /(\w+)\s*\(([^)]*)\)/gm;
        const images = new Map<string, string>();
        const methodCalls = [];
        const defines = new Map<string, string>();
        const variables = new Map<string, string>();
        const layers = [];
        let match;
        sourceCode = sourceCode.replace(/\/\/[^\n]*\n/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
        console.log(sourceCode);
        while ((match = variablesRegex.exec(sourceCode)) !== null) {
            const type = match[1];
            const name = match[2];
            const size = match[3];
            const value = match[5];
            variables.set(name, value);
        }
        while ((match = definesRegex.exec(sourceCode)) !== null) {
            const name = match[1];
            const value = match[2];
            defines.set(name, value);
        }
        while ((match = declarationsRegex.exec(sourceCode)) !== null) {
            const name = match[1];
            const xbmp = match[3]
                .split(',')
                .map((x) => x.trim())
                .join(',');
            images.set(name, xbmp);
        }
        while ((match = cppMethodsRegexp.exec(sourceCode)) !== null) {
            const functionName = match[1];
            const args = match[2].split(',').map((arg) => arg.trim());
            methodCalls.push({functionName, args});
        }
        console.log(methodCalls, images, defines, variables);
        let currentFont = '4x6';
        methodCalls.forEach((call) => {
            switch (call.functionName) {
                case 'setFont':
                    {
                        const [font] = this.getArgs(call.args, defines, variables);
                        currentFont = font.replace('_tr', '').replace('u8g2_font_', '').replace('u8g_font_', '');
                        loadFont(this.fonts.find((f) => f.name === currentFont));
                    }
                    break;
                case 'drawXBMP':
                case 'drawXBM':
                    {
                        const [x, y, width, height, name] = this.getArgs(call.args, defines, variables);
                        const layer = new PaintLayer(this.features);
                        layer.size = new Point(parseInt(width), parseInt(height));
                        layer.position = new Point(parseInt(x), parseInt(y));
                        layer.imageName = name;
                        layer.data = xbmpToImgData(images.get(name), width, height);
                        layers.push(layer);
                    }
                    break;
                case 'drawLine':
                    {
                        const [x1, y1, x2, y2] = this.getArgs(call.args, defines, variables);
                        const layer = new LineLayer(this.features);
                        layer.p1 = new Point(parseInt(x1), parseInt(y1));
                        layer.p2 = new Point(parseInt(x2), parseInt(y2));
                        layers.push(layer);
                    }
                    break;
                case 'drawBox':
                case 'drawFrame':
                    {
                        const [x, y, width, height] = this.getArgs(call.args, defines, variables);
                        const layer = new RectangleLayer(this.features);
                        layer.position = new Point(parseInt(x), parseInt(y));
                        layer.size = new Point(parseInt(width), parseInt(height));
                        layer.fill = call.functionName === 'drawBox';
                        layers.push(layer);
                    }
                    break;
                case 'drawPixel':
                    {
                        const [x, y] = this.getArgs(call.args, defines, variables);
                        const layer = new DotLayer(this.features);
                        layer.position = new Point(parseInt(x), parseInt(y));
                        layer.size = new Point(1, 1);
                        layer.fill = true;
                        layers.push(layer);
                    }
                    break;
                case 'drawStr':
                    {
                        const [x, y, text] = this.getArgs(call.args, defines, variables);
                        const layer = new TextLayer(this.features, getFont(currentFont));
                        layer.position = new Point(parseInt(x), parseInt(y));
                        layer.text = text.replace(/"/g, '');
                        // layer.fontToLoad = currentFont;
                        layers.push(layer);
                    }
                    break;
                case 'drawCircle':
                case 'drawDisc': {
                    const [x, y, radius] = this.getArgs(call.args, defines, variables);
                    const layer = new CircleLayer(this.features);
                    layer.position = new Point(parseInt(x) - parseInt(radius), parseInt(y) - parseInt(radius));
                    layer.radius = parseInt(radius);
                    layer.fill = call.functionName === 'drawDisc';
                    layers.push(layer);
                }
                case 'drawEllipse':
                case 'drawFilledEllipse': {
                    const [x, y, rx, ry] = this.getArgs(call.args, defines, variables);
                    const layer = new EllipseLayer(this.features);
                    layer.position = new Point(parseInt(x) - parseInt(rx), parseInt(y) - parseInt(ry));
                    layer.rx = parseInt(rx);
                    layer.ry = parseInt(ry);
                    layer.fill = call.functionName === 'drawFilledEllipse';
                    layers.push(layer);
                }
            }
        });
        return layers;
    }

    getArgs(args: any[], defines: Map<string, string>, variables: Map<string, string>): any[] {
        return args.map((arg) => {
            if (defines.has(arg)) {
                return defines.get(arg);
            } else if (variables.has(arg)) {
                return variables.get(arg);
            }
            return arg;
        });
    }
}
