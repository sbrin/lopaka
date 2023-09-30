import {Platform} from '../platforms/platform';
import {Tool} from './tool';

export class FrameTool extends Tool {
    name = 'Frame';

    draw(ctx: OffscreenCanvasRenderingContext2D, layer: TLayer): void {
        ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
    }
    code(layer: TLayer, platform: Platform, source: TSourceCode): void {
        platform.drawFrame(layer, source);
    }
}
