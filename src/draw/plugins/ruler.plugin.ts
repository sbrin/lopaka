import {DrawPlugin} from './draw.plugin';

export class RulerPlugin extends DrawPlugin {
    public update(ctx: CanvasRenderingContext2D): void {
        const {scale, display} = this.session.state;
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < display.x; i += scale.x) {
            ctx.moveTo(i * scale.x, 0);
            ctx.lineTo(i * scale.x, scale.y * 1);
        }
        for (let i = 0; i < display.y; i += scale.y) {
            ctx.moveTo(0, i * scale.y);
            ctx.lineTo(scale.x * 1, i * scale.y);
        }
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}
