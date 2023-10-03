import {Platform} from '../../platforms/platform';
import {Tool, ToolParamType} from './tool';
import {drawLine} from '../../graphics';
import {Layer} from 'src/core/layer';
import {Point} from '../../core/point';

export class LineTool extends Tool {
    name: string = 'line';

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

    draw(layer: Layer): void {
        const {dc, position, size} = layer;
        dc.clear().line(position, size);
    }

    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        const {dc} = layer;
        dc.clear().line(layer.position, position);
    }

    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.position = position.clone();
    }

    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.size = position.clone();
    }
}
