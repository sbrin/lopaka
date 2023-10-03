import {Layer} from 'src/core/layer';
import {Point} from '../../core/point';
import {Tool, ToolParamType} from './tool';

export class TextTool extends Tool {
    name = 'string';

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
            name: 'font',
            type: ToolParamType.font,
            setValue(layer: Layer, value: string) {
                layer.data.font = value;
            },
            getValue(layer: Layer) {
                return layer.data.font;
            }
        },
        {
            name: 'text',
            type: ToolParamType.string,
            setValue(layer: Layer, value: string) {
                layer.data.text = value;
            },
            getValue(layer: Layer) {
                return layer.data.text;
            }
        }
    ];

    draw(layer: Layer): void {
        const {dc, data} = layer;
        dc.clear().text(layer.position, data.text, data.font);
    }

    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        const {dc, data} = layer;
        dc.text(position, data.text, data.font);
        layer.position = position.clone();
    }

    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        const {dc} = layer;
        const {name, options} = this.getFont();
        layer.position = position.clone();
        layer.data = {};
        layer.data.text = 'String 123';
        layer.data.font = `${options.size}px ${name}`;
        dc.text(layer.position, layer.data.text, layer.data.font);
    }

    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.position = position.clone().min(layer.position);
        layer.size = position.clone().subtract(layer.position).abs();
    }
}
