import haxrcorp4089_tr from '../../fonts/haxrcorp4089_tr.ttf';
import helvB08_tr from '../../fonts/helvB08_tr.ttf';
import profont22_tr from '../../fonts/profont22_tr.ttf';
import {Platform} from './platform';

export class FlipperPlatform extends Platform {
    protected name = 'Flipper Zero';
    protected description = 'Flipper Zero';
    protected fonts: TPlatformFont[] = [
        {
            name: 'HelvB08',
            file: helvB08_tr,
            options: {
                textContainerHeight: 8,
                textCharWidth: 6,
                size: 8
            }
        },
        {
            name: 'HaXRcorp4089',
            file: haxrcorp4089_tr,
            options: {
                textContainerHeight: 8,
                textCharWidth: 6,
                size: 8
            }
        },
        {
            name: 'Profont22',
            file: profont22_tr,
            options: {
                textContainerHeight: 22,
                textCharWidth: 12,
                size: 22
            }
        }
    ];

    generate(): string {
        throw new Error('Method not implemented.');
    }

    drawDot(layer: TLayer, source: TSourceCode): void {
        source.code.push(`canvas_draw_dot(canvas, ${layer.x}, ${layer.y});`);
    }
    drawLine(layer: TLayer, source: TSourceCode): void {
        source.code.push(`canvas_draw_line(canvas, ${layer.x}, ${layer.y}, ${layer.x2}, ${layer.y2});`);
    }
    drawText(layer: TLayer, source: TSourceCode): void {
        source.code.push(`canvas_draw_text(canvas, ${layer.x}, ${layer.y}, "${layer.text}", &F_${layer.font});`);
    }
    drawBox(layer: TLayer, source: TSourceCode): void {
        source.code.push(`canvas_draw_box(canvas, ${layer.x}, ${layer.y}, ${layer.width}, ${layer.height});`);
    }
    drawFrame(layer: TLayer, source: TSourceCode): void {
        source.code.push(`canvas_draw_frame(canvas, ${layer.x}, ${layer.y}, ${layer.width}, ${layer.height});`);
    }
    drawCircle(layer: TLayer, source: TSourceCode): void {
        source.code.push(
            `canvas_draw_circle(canvas, ${layer.x + layer.radius}, ${layer.y + layer.radius}, ${layer.radius});`
        );
    }
    drawDisc(layer: TLayer, source: TSourceCode): void {
        source.code.push(
            `canvas_draw_disc(canvas, ${layer.x + layer.radius}, ${layer.y + layer.radius}, ${layer.radius});`
        );
    }
    drawBitmap(layer: TLayer, source: TSourceCode): void {
        source.declarations.push(
            `// DRAW tool is not yet supported for Flipper Zero, sorry. It is being ignored from code output`
        );
    }
    drawIcon(layer: TLayer, source: TSourceCode): void {
        source.code.push(`canvas_draw_icon(canvas, ${layer.x}, ${layer.y}, &I_${layer.name});`);
    }
}
