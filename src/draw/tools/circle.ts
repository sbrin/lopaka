import {Layer} from 'src/core/layer';
import {Tool, ToolParamType} from './tool';
import {Point} from '../../core/point';
import {Rect} from '../../core/rect';

export class CircleTool extends Tool {
    name = 'circle';

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
                layer.size = new Point(value).multiply(2).max(new Point(2));
            },
            getValue(layer: Layer) {
                return layer.size.x / 2;
            }
        }
    ];

    private firstPoint: Point;
    private altMode = false;

    draw(layer: Layer): void {
        const {dc, position, size} = layer;
        const radius = size.x / 2;
        const center = position.clone().add(radius);
        dc.clear().pixelateCircle(center, radius, false);
    }

    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        const radius = Math.max(
            Math.max(...position.clone().subtract(this.firstPoint).abs().divide(2).round().xy) - 2,
            1
        );
        layer.size = new Point(radius * 2);
        if (this.altMode) {
            layer.position = this.firstPoint.clone().subtract(radius);
        } else {
            const signs = position.clone().subtract(this.firstPoint).xy.map(Math.sign);
            layer.position = this.firstPoint.min(
                this.firstPoint.clone().add(new Point(radius * 2 + 1).multiply(signs))
            );
        }
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }

    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        this.altMode = originalEvent.altKey;
        this.firstPoint = position.clone();
        layer.position = position.clone();
        layer.size = new Point(2);
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }

    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.bounds = this.getBounds(layer);
    }

    getBounds(layer: Layer): Rect {
        return super.getBounds(layer).add(0, 0, 1, 1);
    }
}
