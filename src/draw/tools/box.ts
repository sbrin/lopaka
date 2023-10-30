import {Layer} from 'src/core/layer';
import {Point} from '../../core/point';
import {Tool, ToolParamType} from './tool';

export class BoxTool extends Tool {
    name = 'box';

    params = [
        {
            name: 'x',
            type: ToolParamType.number,
            setValue(layer: Layer, value: number) {
                layer.position.x = value;
            },
            getValue(layer: Layer) {
                return layer.position.x;
            }
        },
        {
            name: 'y',
            type: ToolParamType.number,
            setValue(layer: Layer, value: number) {
                layer.position.y = value;
            },
            getValue(layer: Layer) {
                return layer.position.y;
            }
        },
        {
            name: 'w',
            type: ToolParamType.number,
            setValue(layer: Layer, value: number) {
                layer.size.x = Math.max(value, 1);
            },
            getValue(layer: Layer) {
                return layer.size.x;
            }
        },
        {
            name: 'h',
            type: ToolParamType.number,
            setValue(layer: Layer, value: number) {
                layer.size.y = Math.max(value, 1);
            },
            getValue(layer: Layer) {
                return layer.size.y;
            }
        }
    ];

    private firstPoint: Point;

    draw(layer: Layer): void {
        const {dc, position, size} = layer;
        dc.clear().rect(position, size, true);
    }

    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.position = position.clone().min(this.firstPoint);
        layer.size = position.clone().subtract(this.firstPoint).abs().max(new Point(1));
        // square
        if (originalEvent.shiftKey) {
            layer.size = new Point(Math.max(layer.size.x, layer.size.y)).max(new Point(1));
        }
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }

    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.position = position.clone();
        layer.size = new Point(1);
        layer.bounds = this.getBounds(layer);
        this.firstPoint = position.clone();
        this.draw(layer);
    }

    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {}
}
