import {Platform} from 'src/platforms/platform';
import {Tool} from './tool';
import {drawDisc} from 'src/graphics';

export class DiscTool extends Tool {
    draw(ctx: OffscreenCanvasRenderingContext2D, layer: TLayer): void {
        const {width, height} = ctx.canvas;
        const imageData = ctx.getImageData(0, 0, width, height);
        drawDisc(imageData, layer.x, layer.y, layer.radius, width, height);
    }
    code(layer: TLayer, platform: Platform, source: TSourceCode): void {
        platform.drawDisc(layer, source);
    }
}
