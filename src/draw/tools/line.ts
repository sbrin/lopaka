import {Layer} from 'src/core/layer';
import {Point} from '../../core/point';
import {Tool, ToolParamType} from './tool';
import {Rect} from '../../core/rect';

export class LineTool extends Tool {
    name: string = 'line';
    brushSize: Point = new Point(1, 1);
    params = [
        {
            name: 'x1',
            type: ToolParamType.number,
            setValue(layer: Layer, value: number) {
                layer.position.x = value;
            },
            getValue(layer: Layer) {
                return layer.position.x;
            }
        },
        {
            name: 'y1',
            type: ToolParamType.number,
            setValue(layer: Layer, value: number) {
                layer.position.y = value;
            },
            getValue(layer: Layer) {
                return layer.position.y;
            }
        },
        {
            name: 'x2',
            type: ToolParamType.number,
            setValue(layer: Layer, value: number) {
                layer.size.x = value - layer.position.x;
            },
            getValue(layer: Layer) {
                return layer.size.x + layer.position.x;
            }
        },
        {
            name: 'y2',
            type: ToolParamType.number,
            setValue(layer: Layer, value: number) {
                layer.size.y = value - layer.position.y;
            },
            getValue(layer: Layer) {
                return layer.size.y + layer.position.y;
            }
        }
    ];

    private firstPoint: Point;

    draw(layer: Layer): void {
        const {dc, position, size} = layer;
        dc.clear().pixelateLine(position, position.clone().add(size), this.brushSize.x);
    }

    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.size = position.clone().subtract(this.firstPoint);
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }

    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        this.firstPoint = position.clone();
        layer.position = position.clone();
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }

    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {}

    getBounds(layer: Layer): Rect {
        const {position, size} = layer;
        const min = position.min(position.clone().add(size));
        const boundSize = size.clone().abs().add(1);
        return new Rect(min, boundSize);
    }
}
