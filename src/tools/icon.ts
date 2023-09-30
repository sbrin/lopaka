import {Platform} from '../platforms/platform';
import {Tool} from './tool';
import {maskAndMixImageData, putImageDataWithAlpha} from '../graphics';

export class IconTool extends Tool {
    name = 'Icon';
    draw(ctx: OffscreenCanvasRenderingContext2D, layer: TLayer): void {
        if (layer.isOverlay) {
            putImageDataWithAlpha(ctx, layer.data, layer.x, layer.y, 0.75);
        } else {
            const {width, height} = ctx.canvas;
            const imageData = ctx.getImageData(0, 0, width, height);
            const newImageData = maskAndMixImageData(imageData, layer.data, layer.x, layer.y);
            ctx.putImageData(newImageData, 0, 0);
        }
    }
    code(layer: TLayer, platform: Platform, source: TSourceCode): void {
        platform.drawIcon(layer, source);
    }
}
