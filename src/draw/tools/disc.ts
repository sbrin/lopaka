import {Layer} from 'src/core/layer';
import {drawDisc} from '../../graphics';
import {Tool, ToolParamType} from './tool';
import {Point} from '../../core/point';
import {Rect} from '../../core/rect';

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
                layer.size = new Point(value * 2).add(1);
            },
            getValue(layer: Layer) {
                return (layer.size.x - 1) / 2;
            }
        }
    ];

    private firstPoint: Point;
    private altMode = false;

    draw(layer: Layer): void {
        const {dc, position, size} = layer;
        const radius = (size.x + 1) / 2;
        const center = position.clone().add(radius);
        dc.clear().pixelateCircle(center, radius, true);
    }

    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        if (this.altMode) {
            const radius = position.clone().subtract(this.firstPoint).abs().divide(2).round().x;
            layer.size = new Point(radius * 2).add(1);
            layer.position = this.firstPoint.clone().subtract(radius);
        } else {
            layer.position = position.clone().min(this.firstPoint);
            const radius = position.clone().subtract(this.firstPoint).abs().divide(2).round().x;
            layer.size = new Point(radius * 2).add(1);
        }
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }

    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        this.altMode = originalEvent.altKey;
        this.firstPoint = position.clone();
        layer.position = position.clone();
    }

    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.bounds = this.getBounds(layer);
    }

    getBounds(layer: Layer): Rect {
        return super.getBounds(layer).add(0, 0, 2, 2);
    }
}
