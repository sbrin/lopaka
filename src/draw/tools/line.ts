import {Platform} from '../../platforms/platform';
import {Tool, ToolParamType} from './tool';
import {drawLine} from '../../graphics';
import {Layer} from 'src/core/layer';
import {Point} from '../../core/point';

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
                layer.size.x = value;
            },
            getValue(layer: Layer) {
                return layer.size.x;
            }
        },
        {
            name: 'y2',
            type: ToolParamType.number,
            setValue(layer: Layer, value: number) {
                layer.size.y = value;
            },
            getValue(layer: Layer) {
                return layer.size.y;
            }
        }
    ];

    private firstPoint: Point;

    draw(layer: Layer): void {
        const {dc, position, size} = layer;
        dc.clear().pixelateLine(position, position.clone().add(size), this.brushSize.x);
    }

    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        const points = [this.firstPoint, position];
        layer.position = position.clone().min(this.firstPoint);
        layer.size = position.clone().subtract(this.firstPoint);
        this.draw(layer);
    }

    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        this.firstPoint = position.clone();
        layer.position = position.clone();
    }

    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        // layer.size = position.clone();
    }
}
