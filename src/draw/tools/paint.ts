import {Layer} from '../../core/layer';
import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {Tool} from './tool';

export class PaintTool extends Tool {
    name = 'paint';

    private brushSize: Point = new Point(1, 1);

    async draw(layer: Layer): Promise<void> {
        const {dc} = layer;
        dc.clear();
        layer.data.forEach((point: Point, n: number) => {
            if (n) {
                dc.pixelateLine(
                    layer.data[n - 1].clone().add(layer.position),
                    point.clone().add(layer.position),
                    this.brushSize.x
                );
            }
        });
        dc.ctx.save();
        dc.ctx.beginPath();
        dc.ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        dc.ctx.rect(layer.bounds.x, layer.bounds.y, layer.bounds.w, layer.bounds.h);
        dc.ctx.fill();
        dc.ctx.restore();
    }

    edit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.data.push(position.clone().subtract(layer.position));
        layer.bounds = this.getBounds(layer);
        this.draw(layer);
    }

    startEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.data = [];
        layer.position = position.clone();
        layer.size = this.brushSize.clone();
        this.draw(layer);
    }

    stopEdit(layer: Layer, position: Point, originalEvent: MouseEvent): void {
        layer.bounds = this.getBounds(layer);
    }

    getBounds(layer: Layer): Rect {
        const position = layer.position.clone();
        const min = layer.data.reduce(
            (pos: Point, point: Point) => pos.clone().min(point),
            new Point(Infinity, Infinity)
        );
        const max = layer.data.reduce(
            (pos: Point, point: Point) => pos.clone().max(point),
            new Point(-Infinity, -Infinity)
        );
        const size = max.clone().subtract(min).add(1);
        return new Rect(min.add(position), size);
    }
}
