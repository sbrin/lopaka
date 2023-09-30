import {Platform} from '../platforms/platform';
import {Tool} from './tool';

export class DotTool extends Tool {
    name = 'Dot';

    draw(ctx: OffscreenCanvasRenderingContext2D, layer: TLayer): void {
        ctx.fillRect(layer.x, layer.y, 1, 1);
    }
    code(layer: TLayer, platform: Platform, source: TSourceCode): void {
        platform.drawDot(layer, source);
    }
}
