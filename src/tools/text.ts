import {Platform} from '../platforms/platform';
import {Tool} from './tool';
import {drawTextWithMasking} from '../graphics';

export class TextTool extends Tool {
    name = 'String';
    draw(ctx: OffscreenCanvasRenderingContext2D, layer: TLayer): void {
        const {width, height} = ctx.canvas;
        const imageData = ctx.getImageData(0, 0, width, height);
        const imageDataWithText = drawTextWithMasking(imageData, layer.x, layer.y, layer.font, layer.text);
        ctx.putImageData(imageDataWithText, 0, 0);
    }
    code(layer: TLayer, platform: Platform, source: TSourceCode): void {
        platform.drawText(layer, source);
    }
}
