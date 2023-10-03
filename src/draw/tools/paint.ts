import {Layer} from '../../core/layer';
import {Point} from '../../core/point';
import {Tool} from './tool';

export class PaintTool extends Tool {
    name = 'paint';

    private brushSize: Point = new Point(1, 1);

    draw(layer: Layer): void {
        const {dc} = layer;
        dc.clear();
        layer.data.forEach((point: Point) => {
            dc.rect(point, this.brushSize, true);
        });
    }

    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        const {dc} = layer;
        dc.line(layer.data[layer.data.length - 1], position);
        layer.data.push(position.clone());
    }

    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        const {dc} = layer;
        layer.data = [position.clone()];
        dc.rect(position, this.brushSize, true);
    }

    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        const {data} = layer;
        const newData: Point[] = [];
        data.forEach((point: Point) => {
            if (!newData.find((p) => p.equals(point))) {
                newData.push(point);
            }
        });
        layer.data = newData;
    }
}
