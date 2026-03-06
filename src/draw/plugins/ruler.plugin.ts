import {DrawPlugin} from './draw.plugin';

export class RulerPlugin extends DrawPlugin {
    public update(ctx: CanvasRenderingContext2D): void {
        const {scale, display} = this.session.state;
        const {interfaceColors} = this.session.getPlatformFeatures();
        const canvasW = display.x * scale.x;
        const canvasH = display.y * scale.y;
        ctx.save();
        ctx.translate(0.5, 0.5);
        ctx.beginPath();
        // Top ruler
        for (let i = 0; i < display.x; i += 2) {
            ctx.moveTo(i * scale.x, -8);
            ctx.lineTo(i * scale.x, i % 10 === 0 ? -2 : -5);
        }
        // Left ruler
        for (let i = 0; i < display.y; i += 2) {
            ctx.moveTo(-8, i * scale.y);
            ctx.lineTo(i % 10 === 0 ? -2 : -5, i * scale.y);
        }
        // Bottom ruler (mirrored)
        for (let i = 0; i < display.x; i += 2) {
            ctx.moveTo(i * scale.x, canvasH + 8);
            ctx.lineTo(i * scale.x, i % 10 === 0 ? canvasH + 2 : canvasH + 5);
        }
        // Right ruler (mirrored)
        for (let i = 0; i < display.y; i += 2) {
            ctx.moveTo(canvasW + 8, i * scale.y);
            ctx.lineTo(i % 10 === 0 ? canvasW + 2 : canvasW + 5, i * scale.y);
        }
        ctx.strokeStyle = interfaceColors.rulerColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}
