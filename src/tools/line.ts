import {Platform} from '../platforms/platform';
import {Tool} from './tool';
import {drawLine} from '../graphics';

export class LineTool extends Tool {
    name: string = 'Line';

    draw(ctx: OffscreenCanvasRenderingContext2D, layer: TLayer): void {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        drawLine(imageData, layer.x, layer.y, layer.x2, layer.y2, false);
    }
    code(layer: TLayer, platform: Platform, source: TSourceCode): void {
        platform.drawLine(layer, source);
    }
}
