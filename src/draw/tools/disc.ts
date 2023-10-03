import {Layer} from 'src/core/layer';
import {drawDisc} from '../../graphics';
import {Tool, ToolParamType} from './tool';
import {Point} from '../../core/point';

export class DiscTool extends Tool {
    name = 'disc';

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
            name: 'radius',
            type: ToolParamType.number,
            setValue(layer: Layer, value: number) {
                layer.size.x = value;
            },
            getValue(layer: Layer) {
                return layer.size.x;
            }
        }
    ];

    draw(layer: Layer): void {
        const {dc, position, size} = layer;
        dc.clear().circle(position, size.x / 2, true);
    }

    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        const {dc} = layer;
        dc.clear().circle(layer.position.clone(), position.clone().subtract(layer.position).abs().x, true);
    }

    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.dc.ctx.translate(0.5, 0.5);
        layer.position = position.clone();
    }

    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        console.log(this.mousePos, position, layer);
        layer.position = position.clone().min(layer.position);
        layer.size = position.clone().subtract(layer.position).abs();
    }
}
