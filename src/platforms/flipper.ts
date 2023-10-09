import {Layer} from 'src/core/layer';
import haxrcorp4089 from '../../fonts/haxrcorp4089.ttf';
import helvB08 from '../../fonts/helvB08.ttf';
import profont22 from '../../fonts/profont22.ttf';
import {Platform} from './platform';

export class FlipperPlatform extends Platform {
    public static id = 'flipper';
    protected name = 'Flipper Zero';
    protected description = 'Flipper Zero';
    protected fonts: TPlatformFont[] = [
        {
            name: 'helvB08_tr',
            file: helvB08,
            options: {
                textCharHeight: 8,
                textCharWidth: 6,
                size: 8
            }
        },
        {
            name: 'HaXRcorp4089_tr',
            file: haxrcorp4089,
            options: {
                textCharHeight: 8,
                textCharWidth: 6,
                size: 8
            }
        },
        {
            name: 'Profont22_tr',
            file: profont22,
            options: {
                textCharHeight: 22,
                textCharWidth: 12,
                size: 22
            }
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
        const radius = (layer.size.x + 1) / 2;
        const center = layer.position.clone().add(radius).add(1);
        source.code.push(`canvas_draw_circle(canvas, ${center.x}, ${center.y}, ${radius});`);
    }
    addDisc(layer: Layer, source: TSourceCode): void {
        const radius = (layer.size.x + 1) / 2;
        const center = layer.position.clone().add(radius).add(1);
        source.code.push(`canvas_draw_disc(canvas, ${center.x}, ${center.y}, ${radius});`);
    }
    addImage(layer: Layer, source: TSourceCode): void {
        source.declarations.push(
            `// add tool is not yet supported for Flipper Zero, sorry. It is being ignored from code output`
        );
    }
    addIcon(layer: Layer, source: TSourceCode): void {
        source.code.push(`canvas_draw_icon(canvas, ${layer.position.x}, ${layer.position.y}, &I_${layer.name});`);
    }
}
