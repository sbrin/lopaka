import {Platform} from './platform';
import {DotLayer} from '../core/layers/dot.layer';
import {LineLayer} from '../core/layers/line.layer';
import {TextLayer} from '../core/layers/text.layer';
import {BoxLayer} from '../core/layers/box.layer';
import {FrameLayer} from '../core/layers/frame.layer';
import {CircleLayer} from '../core/layers/circle.layer';
import {DiscLayer} from '../core/layers/disc.layer';
import {IconLayer} from '../core/layers/icon.layer';
import {fontTypes} from '../draw/fonts/fontTypes';
import {imgDataToXBMP, toCppVariableName} from '../utils';
import {PaintLayer} from '../core/layers/paint.layer';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {EllipseLayer} from '../core/layers/ellipse.layer';

const flipperFontMap = {
    helvB08_tr: 'FontPrimary',
    haxrcorp4089_tr: 'FontSecondary',
    profont11_mr: 'FontKeyboard',
    profont22_tr: 'FontBigNumbers'
};

export class FlipperPlatform extends Platform {
    public static id = 'flipper';
    protected name = 'Flipper Zero';
    protected description = 'Flipper Zero';
    protected fonts: TPlatformFont[] = [
        fontTypes['haxrcorp4089_tr'],
        fontTypes['helvB08_tr'],
        fontTypes['profont22_tr']
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
            `canvas_set_font(canvas, ${flipperFontMap[layer.font.name]});
canvas_draw_str(canvas, ${layer.position.x}, ${layer.position.y}, "${layer.text}");`
        );
    }
    addBox(layer: BoxLayer, source: TSourceCode): void {
        source.code.push(
            `canvas_draw_box(canvas, ${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y});`
        );
    }
    addFrame(layer: FrameLayer, source: TSourceCode): void {
        source.code.push(
            `canvas_draw_frame(canvas, ${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y});`
        );
    }
    addCircle(layer: CircleLayer, source: TSourceCode): void {
        const {radius, position} = layer;
        const center = position.clone().add(radius);
        source.code.push(`canvas_draw_circle(canvas, ${center.x}, ${center.y}, ${radius});`);
    }
    addDisc(layer: DiscLayer, source: TSourceCode): void {
        const {radius, position} = layer;
        const center = position.clone().add(radius);
        source.code.push(`canvas_draw_disc(canvas, ${center.x}, ${center.y}, ${radius});`);
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
