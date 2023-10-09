import {Layer} from 'src/core/layer';
import {Point} from '../../core/point';
import {Tool} from './tool';

export class IconTool extends Tool {
    name = 'icon';
    draw(layer: Layer): void {
        // if (layer.isOverlay) {
        //     putImageDataWithAlpha(ctx, layer.data, layer.position.x, layer.position.y, 0.75);
        // } else {
        //     const {width, height} = ctx.canvas;
        //     const imageData = ctx.getImageData(0, 0, width, height);
        //     const newImageData = maskAndMixImageData(imageData, layer.data, layer.position.x, layer.position.y);
        //     ctx.putImageData(newImageData, 0, 0);
        // }
    }
    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        // throw new Error('Method not implemented.');
    }
    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        // throw new Error('Method not implemented.');
    }
    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        // throw new Error('Method not implemented.');
    }
}
