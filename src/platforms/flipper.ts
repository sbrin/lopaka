import {AbstractLayer} from '../core/layers/abstract.layer';
import {CircleLayer} from '../core/layers/circle.layer';
import {DotLayer} from '../core/layers/dot.layer';
import {EllipseLayer} from '../core/layers/ellipse.layer';
import {IconLayer} from '../core/layers/icon.layer';
import {LineLayer} from '../core/layers/line.layer';
import {PaintLayer} from '../core/layers/paint.layer';
import {RectangleLayer} from '../core/layers/rectangle.layer';
import {TextLayer} from '../core/layers/text.layer';
import {FontFormat} from '../draw/fonts/font';
import {bdfFonts} from '../draw/fonts/fontTypes';
import {imgDataToXBMP, toCppVariableName} from '../utils';
import {Platform} from './platform';

export class FlipperPlatform extends Platform {
    public static id = 'flipper';
    protected name = 'Flipper Zero';
    protected description = 'Flipper Zero';
    protected fonts: TPlatformFont[] = [
        {
            title: 'FontPrimary',
            name: 'FontPrimary',
            file: bdfFonts.find((f) => f.name === 'helvB08').file,
            format: FontFormat.FORMAT_BDF
        },
        {
            title: 'FontSecondary',
            name: 'FontSecondary',
            file: bdfFonts.find((f) => f.name === 'haxrcorp4089').file,
            format: FontFormat.FORMAT_BDF
        },
        {
            title: 'FontKeyboard',
            name: 'FontKeyboard',
            file: bdfFonts.find((f) => f.name === 'profont11').file,
            format: FontFormat.FORMAT_BDF
        },
        {
            title: 'FontBigNumbers',
            name: 'FontBigNumbers',
            file: bdfFonts.find((f) => f.name === 'profont22').file,
            format: FontFormat.FORMAT_BDF
        }
    ];

    public generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D): TSourceCode {
        const source = super.generateSourceCode(layers, ctx);
        source.declarations.unshift('canvas_set_bitmap_mode(canvas, true);');
        return source;
    }

    addDot(layer: DotLayer, source: TSourceCode): void {
        source.code.push(`canvas_draw_dot(canvas, ${layer.position.x}, ${layer.position.y});`);
    }
    addLine(layer: LineLayer, source: TSourceCode): void {
        const {p1, p2} = layer;
        source.code.push(`canvas_draw_line(canvas, ${p1.x}, ${p1.y}, ${p2.x}, ${p2.y});`);
    }
    addText(layer: TextLayer, source: TSourceCode): void {
        source.code.push(
            `canvas_set_font(canvas, ${layer.font.name});
canvas_draw_str(canvas, ${layer.position.x}, ${layer.position.y}, "${layer.text}");`
        );
    }
    addRect(layer: RectangleLayer, source: TSourceCode): void {
        if (layer.fill) {
            source.code.push(
                `canvas_draw_box(canvas, ${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y});`
            );
        } else {
            source.code.push(
                `canvas_draw_frame(canvas, ${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y});`
            );
        }
    }
    addCircle(layer: CircleLayer, source: TSourceCode): void {
        const {radius, position, fill} = layer;
        const center = position.clone().add(radius);
        if (fill) {
            source.code.push(`canvas_draw_disc(canvas, ${center.x}, ${center.y}, ${radius});`);
        } else {
            source.code.push(`canvas_draw_circle(canvas, ${center.x}, ${center.y}, ${radius});`);
        }
    }
    addEllipse(layer: EllipseLayer, source: TSourceCode): void {}
    addImage(layer: PaintLayer, source: TSourceCode): void {
        let image;
        if (!layer.position || !layer.size.x || !layer.size.y) return;
        image = layer
            .getBuffer()
            .getContext('2d')
            .getImageData(layer.position.x, layer.position.y, layer.size.x, layer.size.y);
        const XBMP = imgDataToXBMP(image, 0, 0, layer.size.x, layer.size.y);
        const varName = `image_${toCppVariableName(layer.name)}_bits`;
        const varDeclaration = `const uint8_t ${varName}[] = {${XBMP}};`;
        if (!source.declarations.includes(varDeclaration)) {
            source.declarations.push(varDeclaration);
        }
        source.code.push(
            `canvas_draw_xbm(canvas, ${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y}, ${varName});`
        );
    }
    addIcon(layer: IconLayer, source: TSourceCode): void {
        const varName = `&I_${toCppVariableName(layer.name)}`;
        source.code.push(`canvas_draw_icon(canvas, ${layer.position.x}, ${layer.position.y}, ${varName});`);
    }
}
