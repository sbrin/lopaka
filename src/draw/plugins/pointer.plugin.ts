import {Point} from '../../core/point';
import {DrawPlugin} from './draw.plugin';

export class PointerPlugin extends DrawPlugin {
    public update(ctx: CanvasRenderingContext2D, point: Point): void {
        const {display, scale} = this.session.state;
        if (point) {
            ctx.save();
            ctx.beginPath();
            // hrizontal line
            ctx.moveTo(0, point.y - 0.5);
            ctx.lineTo(display.x * scale.x, point.y - 0.5);
            // vertical line
            ctx.moveTo(point.x - 0.5, 0);
            ctx.lineTo(point.x - 0.5, display.y * scale.y);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
    }
}
