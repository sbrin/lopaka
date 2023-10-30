import {Layer} from 'src/core/layer';
import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {getFont} from '../fonts';
import {Tool, ToolParamType} from './tool';

export class TextTool extends Tool {
    name = 'string';

    private scaleFactor: number = 1;
    private lastFont: string;

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
                layer.position.y = value - layer.size.y;
            },
            getValue(layer: Layer) {
                return layer.position.y + layer.size.y;
            }
        },
        {
            name: 'font',
            type: ToolParamType.font,
            setValue(layer: Layer, value: string) {
                layer.data.font = value;
                this.lastFont = value;
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
        dc.clear();
        const font = getFont(data.font);
        const bounds = this.getBounds(layer);
        layer.size = bounds.size;
        font.drawText(dc, data.text, layer.position.clone().subtract(0, layer.size.y), this.scaleFactor);
        dc.ctx.save();
        dc.ctx.fillStyle = 'rgba(0,0,0,0)';
        dc.ctx.beginPath();
        dc.ctx.rect(bounds.x, bounds.y, bounds.w, bounds.h);
        dc.ctx.fill();
        dc.ctx.restore();
    }

    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.position = position.clone();
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }

    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.position = position.clone();
        if (!layer.data.text) {
            layer.data.text = 'String 123';
        }
        if (!layer.data.font) {
            layer.data.font = this.lastFont || this.session.platforms[this.session.state.platform].getFonts()[0].name;
        }
        // get previous font or default for the platform
        this.lastFont = layer.data.font;
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }

    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.position = position.clone();
        this.draw(layer);
    }

    getBounds(layer: Layer): Rect {
        const size = getFont(layer.data.font).getSize(layer.dc, layer.data.text);
        return new Rect(layer.position.clone().subtract(0, size.y), size);
    }
}
