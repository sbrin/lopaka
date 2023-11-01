import {Point} from '../../core/point';
import {VirtualScreenPlugin} from './virtual-screen.plugin';

export class PointerPlugin extends VirtualScreenPlugin {
    public update(ctx: CanvasRenderingContext2D, position: Point): void {
        const {display, scale} = this.session.state;
        if (position) {
            ctx.save();
            ctx.beginPath();
            // hrizontal line
            ctx.moveTo(0, position.y - 0.5);
            ctx.lineTo(display.x * scale.x, position.y - 0.5);
            // vertical line
            ctx.moveTo(position.x - 0.5, 0);
            ctx.lineTo(position.x - 0.5, display.y * scale.y);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
    }
}
