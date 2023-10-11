import {Layer} from 'src/core/layer';
import {Point} from '../../core/point';
import {BDFFont} from '../fonts/bdf.font';
import {Font} from '../fonts/font';
import {Tool, ToolParamType} from './tool';

export class TextTool extends Tool {
    name = 'string';

    font: Font = new BDFFont(); // TODO support multiple fonts
    private scaleFactor: number = 1;

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
        // const {name, options} = this.getFont();
        // dc.ctx.save();
        // dc.ctx.font = `${options.size}px ${name}`;
        // const size = new Point(dc.ctx.measureText(data.text).width, options.textCharHeight);
        // dc.ctx.restore();
        return new Point(data.text.length * 6, 8);
    }

    draw(layer: Layer): void {
        const {dc, data} = layer;
        dc.clear();
        dc.ctx.beginPath();
        // layer.bounds =
        this.font.drawText(dc, data.text, layer.position, this.scaleFactor);
        dc.ctx.fill();
    }

    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.position = position.clone();
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }

    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        // console.log(this.font.getCharData('S'.charCodeAt(0)));
        // const {dc} = layer;
        // const {name, options} = this.getFont();
        layer.position = position.clone();
        layer.data = {};
        layer.data.text = 'String 123';
        layer.size = this.getTextSize(layer);
        // layer.data.font = `${options.size}px ${name}`;
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }

    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {}
}
