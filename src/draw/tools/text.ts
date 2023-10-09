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

    private getTextSize(layer: Layer): Point {
        const {dc, data} = layer;
        const {name, options} = this.getFont();
        dc.ctx.save();
        dc.ctx.font = `${options.size}px ${name}`;
        const size = new Point(dc.ctx.measureText(data.text).width, options.textCharHeight);
        dc.ctx.restore();
        return size;
    }

    draw(layer: Layer): void {
        const {dc, data} = layer;
        dc.clear().text(layer.position, data.text, data.font);
        dc.ctx.save();
        dc.ctx.beginPath();
        dc.ctx.rect(layer.position.x, layer.position.y, layer.size.x, layer.size.y);
        dc.ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        dc.ctx.fill();
        dc.ctx.restore();
    }

    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.position = position.clone();
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }

    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        const {dc} = layer;
        const {name, options} = this.getFont();
        layer.position = position.clone();
        layer.size = this.getTextSize(layer);
        layer.data = {};
        layer.data.text = 'String 123';
        layer.data.font = `${options.size}px ${name}`;
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }

    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {}
}
