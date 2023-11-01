import {Layer} from 'src/core/layer';
import haxrcorp4089 from '../../fonts/haxrcorp4089.ttf?url';
import helvB08 from '../../fonts/helvB08.ttf?url';
import profont22 from '../../fonts/profont22.ttf?url';
import {Platform} from './platform';
import {FontFormat} from '../draw/fonts/font';

export class FlipperPlatform extends Platform {
    public static id = 'flipper';
    protected name = 'Flipper Zero';
    protected description = 'Flipper Zero';
    protected fonts: TPlatformFont[] = [
        {
            name: 'helvB08_tr',
            title: 'Helvetica Bold 8',
            file: helvB08,
            options: {
                textCharHeight: 8,
                textCharWidth: 5,
                size: 8
            },
            format: FontFormat.FORMAT_TTF
        },
        {
            name: 'HaXRcorp4089_tr',
            title: 'HaXRcorp 4089 8',
            file: haxrcorp4089,
            options: {
                textCharHeight: 8,
                textCharWidth: 4,
                size: 16
            },
            format: FontFormat.FORMAT_TTF
        },
        {
            name: 'Profont22_tr',
            title: 'Profont 22',
            file: profont22,
            options: {
                textCharHeight: 16,
                textCharWidth: 11,
                size: 22
            },
            format: FontFormat.FORMAT_TTF
        }
    ];

    addDot(layer: Layer, source: TSourceCode): void {
        source.code.push(`canvas_draw_dot(canvas, ${layer.position.x}, ${layer.position.y});`);
    }
    addLine(layer: Layer, source: TSourceCode): void {
        const from = layer.position.clone();
        const to = layer.position.clone().add(layer.size);
        source.code.push(`canvas_draw_line(canvas, ${from.x}, ${from.y}, ${to.x}, ${to.y});`);
    }
    addText(layer: Layer, source: TSourceCode): void {
        source.code.push(
            `canvas_draw_text(canvas, ${layer.position.x}, ${layer.position.y}, "${layer.data.text}", &F_${layer.data.font});`
        );
    }
    addBox(layer: Layer, source: TSourceCode): void {
        source.code.push(
            `canvas_draw_box(canvas, ${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y});`
        );
    }
    addFrame(layer: Layer, source: TSourceCode): void {
        source.code.push(
            `canvas_draw_frame(canvas, ${layer.position.x}, ${layer.position.y}, ${layer.size.x}, ${layer.size.y});`
        );
    }
    addCircle(layer: Layer, source: TSourceCode): void {
        const radius = layer.size.x / 2;
        const center = layer.position.clone().add(radius).add(1);
        source.code.push(`canvas_draw_circle(canvas, ${center.x}, ${center.y}, ${radius});`);
    }
    addDisc(layer: Layer, source: TSourceCode): void {
        const radius = layer.size.x / 2;
        const center = layer.position.clone().add(radius).add(1);
        source.code.push(`canvas_draw_disc(canvas, ${center.x}, ${center.y}, ${radius});`);
    }
    addImage(layer: Layer, source: TSourceCode): void {
        source.declarations.push(
            `// PAINT tool is not yet supported for Flipper Zero, sorry. It is being ignored from code output`
        );
    }
    addIcon(layer: Layer, source: TSourceCode): void {
        source.code.push(`canvas_draw_icon(canvas, ${layer.position.x}, ${layer.position.y}, &I_${layer.name});`);
    }
}
