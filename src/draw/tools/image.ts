import {Layer} from 'src/core/layer';
import {maskAndMixImageData} from '../../graphics';
import {Tool} from './tool';

export class ImageTool extends Tool {
    name = 'image';
    draw(ctx: OffscreenCanvasRenderingContext2D, layer: Layer): void {
        const {width, height} = ctx.canvas;
        const imageData = ctx.getImageData(0, 0, width, height);
        const newImageData = maskAndMixImageData(imageData, layer.data, layer.position.x, layer.position.y);
        ctx.putImageData(newImageData, 0, 0);
    }
}
