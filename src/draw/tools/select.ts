import {Layer} from '../../core/layer';
import {Point} from '../../core/point';
import {Tool} from './tool';

export class SelectTool extends Tool {
    name = 'select';
    isModifier = true;
    private originalPosition: Point = null;
    private originalSize: Point = null;
    private offset: Point = null;

    draw(layer: Layer): void {
        this.getTool(layer.type).draw(layer);
    }
    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        this.originalPosition = layer.position.clone();
        layer.position = position.clone().subtract(this.offset);
        this.draw(layer);
    }
    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        this.originalPosition = layer.position.clone();
        this.originalSize = layer.size.clone();
        this.offset = position.clone().subtract(layer.position);
    }
    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        this.getTool(layer.type).stopEdit(layer, position, originalEvent);
        // throw new Error('Method not implemented.');
    }
}
