import {Layer} from 'src/core/layer';
import {maskAndMixImageData, putImageDataWithAlpha} from '../../graphics';
import {Tool} from './tool';

export class IconTool extends Tool {
    name = 'icon';
    draw(ctx: OffscreenCanvasRenderingContext2D, layer: Layer): void {
        if (layer.isOverlay) {
            putImageDataWithAlpha(ctx, layer.data, layer.position.x, layer.position.y, 0.75);
        } else {
            const {width, height} = ctx.canvas;
            const imageData = ctx.getImageData(0, 0, width, height);
            const newImageData = maskAndMixImageData(imageData, layer.data, layer.position.x, layer.position.y);
            ctx.putImageData(newImageData, 0, 0);
        }
    }
}
