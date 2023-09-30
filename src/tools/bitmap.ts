import {Platform} from 'src/platforms/platform';
import {Tool} from './tool';
import {maskAndMixImageData} from 'src/graphics';

export class BitmapTool extends Tool {
    name = 'Draw';
    draw(ctx: OffscreenCanvasRenderingContext2D, layer: TLayer): void {
        const {width, height} = ctx.canvas;
        const imageData = ctx.getImageData(0, 0, width, height);
        const newImageData = maskAndMixImageData(imageData, layer.data, layer.x, layer.y);
        ctx.putImageData(newImageData, 0, 0);
    }
    code(layer: TLayer, platform: Platform, source: TSourceCode): void {
        platform.drawBitmap(layer, source);
    }
}
