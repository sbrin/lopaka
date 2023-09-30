import {Platform} from '../platforms/platform';
import {Tool} from './tool';

export class BoxTool extends Tool {
    name = 'Box';

    draw(ctx: OffscreenCanvasRenderingContext2D, layer: TLayer): void {
        ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
    }
    code(layer: TLayer, platform: Platform, source: TSourceCode): void {
        platform.drawBox(layer, source);
    }
}
