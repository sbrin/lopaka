import {Platform} from './platform';
import {DotLayer} from '../core/layers/dot.layer';
import {LineLayer} from '../core/layers/line.layer';
import {TextLayer} from '../core/layers/text.layer';
import {BoxLayer} from '../core/layers/box.layer';
import {FrameLayer} from '../core/layers/frame.layer';
import {CircleLayer} from '../core/layers/circle.layer';
import {DiscLayer} from '../core/layers/disc.layer';
import {IconLayer} from '../core/layers/icon.layer';
import { fontTypes } from "../draw/fonts/fontTypes";
import { toCppVariableName } from "../utils";

export class FlipperPlatform extends Platform {
    public static id = 'flipper';
    protected name = 'Flipper Zero';
    protected description = 'Flipper Zero';
    protected fonts: TPlatformFont[] = [
        fontTypes['haxrcorp4089_tr'],
        fontTypes['helvB08_tr'],
        fontTypes['profont22_tr'],
    ];

    addDot(layer: DotLayer, source: TSourceCode): void {
        source.code.push(`canvas_draw_dot(canvas, ${layer.position.x}, ${layer.position.y});`);
    }
    addLine(layer: LineLayer, source: TSourceCode): void {
        const {p1, p2} = layer;
        source.code.push(`canvas_draw_line(canvas, ${p1.x}, ${p1.y}, ${p2.x}, ${p2.y});`);
    }
    addText(layer: TextLayer, source: TSourceCode): void {
        source.code.push(
            `canvas_draw_text(canvas, ${layer.position.x}, ${layer.position.y}, "${layer.text}", &F_${layer.font.name});`
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
        const center = position.clone().add(radius).add(1);
        source.code.push(`canvas_draw_circle(canvas, ${center.x}, ${center.y}, ${radius});`);
    }
    addDisc(layer: DiscLayer, source: TSourceCode): void {
        const {radius, position} = layer;
        const center = position.clone().add(radius).add(1);
        source.code.push(`canvas_draw_disc(canvas, ${center.x}, ${center.y}, ${radius});`);
    }
    addImage(layer: IconLayer, source: TSourceCode): void {
        if (!layer.image) return;
        source.declarations.push(
            `// PAINT tool is not yet supported for Flipper Zero, sorry. It is being ignored from code output`
        );
    }
    addIcon(layer: IconLayer, source: TSourceCode): void {
        const varName = `&I_${toCppVariableName(layer.imageName)}`;
        source.code.push(`canvas_draw_icon(canvas, ${layer.position.x}, ${layer.position.y}, ${varName});`);
    }
}
