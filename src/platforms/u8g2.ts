import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {CircleLayer} from '../core/layers/circle.layer';
import {DotLayer} from '../core/layers/dot.layer';
import {EllipseLayer} from '../core/layers/ellipse.layer';
import {IconLayer} from '../core/layers/icon.layer';
import {LineLayer} from '../core/layers/line.layer';
import {PaintLayer} from '../core/layers/paint.layer';
import {RectangleLayer} from '../core/layers/rectangle.layer';
import {TextLayer} from '../core/layers/text.layer';
import {fontTypes} from '../draw/fonts/fontTypes';
import {imgDataToXBMP, toCppVariableName} from '../utils';
import {Platform} from './platform';

const u8g2FontMap = {
    f4x6_tr: '4x6_tr'
};

export class U8g2Platform extends Platform {
    public static id = 'u8g2';
    protected name = 'U8g2';
    protected description = 'U8g2';
    protected fonts: TPlatformFont[] = [
        fontTypes['4x6_tr'],
        fontTypes['5x8_tr'],
        fontTypes['haxrcorp4089_tr'],
        fontTypes['helvB08_tr'],
        fontTypes['6x10_tr'],
        fontTypes['profont22_tr']
    ];

    constructor() {
        super();
        this.features.hasInvertedColors = true;
        this.features.defaultColor = '#FFFFFF';
    }

    public generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D): TSourceCode {
        const source = super.generateSourceCode(layers, ctx);
        source.declarations.unshift('u8g2.setBitmapMode(1);');
        source.declarations.unshift('u8g2.setFontMode(1);');
        return source;
    }

    addDot(layer: DotLayer, source: TSourceCode): void {
        source.code.push(`u8g2.drawPixel(${layer.position.x}, ${layer.position.y});`);
    }
    addLine(layer: LineLayer, source: TSourceCode): void {
        const {p1, p2} = layer;
        source.code.push(`u8g2.drawLine(${p1.x}, ${p1.y}, ${p2.x}, ${p2.y});`);
    }
    addText(layer: TextLayer, source: TSourceCode): void {
        const fontName = `u8g2_font_${u8g2FontMap[layer.font.name] ?? layer.font.name}`;
        source.code.push(`u8g2.setFont(${fontName});
u8g2.drawStr(${layer.position.x}, ${layer.position.y}, "${layer.text}");`);
    }
    addRect(layer: RectangleLayer, source: TSourceCode): void {
        if (layer.fill) {
            source.code.push(
                `u8g2.drawBox(${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y});`
            );
        } else {
            source.code.push(
                `u8g2.drawFrame(${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y});`
            );
        }
    }
    addCircle(layer: CircleLayer, source: TSourceCode): void {
        const {radius, position, fill} = layer;
        const center = position.clone().add(radius);
        if (fill) {
            source.code.push(`u8g2.drawDisc(${center.x}, ${center.y}, ${radius});`);
        } else {
            source.code.push(`u8g2.drawCircle(${center.x}, ${center.y}, ${radius});`);
        }
    }
    addEllipse(layer: EllipseLayer, source: TSourceCode): void {
        const {radiusX, radiusY, position} = layer;
        const center = position.clone().add(radiusX, radiusY);
        if (radiusX === radiusY) {
            if (layer.fill) {
                source.code.push(`u8g2.drawDisc(${center.x}, ${center.y}, ${radiusX});`);
            } else {
                source.code.push(`u8g2.drawCircle(${center.x}, ${center.y}, ${radiusX});`);
            }
        } else {
            if (layer.fill) {
                source.code.push(`u8g2.drawFilledEllipse(${center.x}, ${center.y}, ${radiusX}, ${radiusY});`);
            } else {
                source.code.push(`u8g2.drawEllipse(${center.x}, ${center.y}, ${radiusX}, ${radiusY});`);
            }
        }
    }
    addImage(layer: IconLayer | PaintLayer, source: TSourceCode): void {
        let image;
        if (layer instanceof AbstractImageLayer) {
            if (!layer.data) return;
            image = layer.data;
        }
        const XBMP = imgDataToXBMP(image, 0, 0, layer.size.x, layer.size.y);
        const varName = `image_${toCppVariableName(layer.name)}_bits`;
        const varDeclaration = `static const unsigned char ${varName}[] U8X8_PROGMEM = {${XBMP}};`;
        if (!source.declarations.includes(varDeclaration)) {
            source.declarations.push(varDeclaration);
        }
        source.code.push(
            `u8g2.drawXBMP( ${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y}, ${varName});`
        );
    }
    addIcon(layer: IconLayer, source: TSourceCode): void {
        return this.addImage(layer, source);
    }
}
