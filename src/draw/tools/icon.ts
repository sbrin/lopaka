import {Layer} from 'src/core/layer';
import {Point} from '../../core/point';
import {Tool, ToolParamType} from './tool';

export class IconTool extends Tool {
    name = 'icon';

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
            name: 'image',
            type: ToolParamType.image,
            setValue(layer: Layer, value: HTMLImageElement) {
                layer.data.icon = value;
                layer.data.name = value.dataset.name;
                layer.size = new Point(value.width, value.height);
            },
            getValue(layer: Layer) {
                return layer.data.name;
            }
        }
    ];

    async draw(layer: Layer): Promise<void> {
        const {dc, position} = layer;
        dc.clear();
        dc.ctx.drawImage(layer.data.icon, position.x, position.y);
        dc.ctx.save();
        dc.ctx.fillStyle = 'rgba(0,0,0,0)';
        dc.ctx.beginPath();
        dc.ctx.rect(layer.bounds.x, layer.bounds.y, layer.bounds.w, layer.bounds.h);
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
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }
    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.position = position.clone();
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }
}
