import {DrawPlugin} from './draw.plugin';

export class SmartRulerPlugin extends DrawPlugin {
    public update(ctx: CanvasRenderingContext2D): void {
        const {layers, scale} = this.session.state;
        // show distance to left and top
        ctx.save();
        ctx.beginPath();
        layers
            .filter((layer) => layer.selected)
            .forEach((layer) => {
                const p1 = layer.bounds.pos.clone().multiply(scale);
                const p2 = layer.bounds.size.clone().multiply(scale).add(p1);
                // horizontal line p1
                ctx.moveTo(0, p1.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.textBaseline = 'bottom';
                ctx.fillText(`${layer.bounds.y}`, 0, p1.y - 2);
                // vertical line p1
                ctx.moveTo(p1.x, 0);
                ctx.lineTo(p1.x, p1.y);
                ctx.textBaseline = 'top';
                ctx.fillText(`${layer.bounds.x}`, p1.x + 2, 0);
                if (Math.abs(p1.distanceTo(p2)) > 10) {
                    // horizontal line p2
                    ctx.moveTo(0, p2.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(`${layer.bounds.h + layer.bounds.y}`, 0, p2.y - 2);

                    // vertical line p2
                    ctx.moveTo(p2.x, 0);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.textBaseline = 'top';
                    ctx.fillText(`${layer.bounds.w + layer.bounds.x}`, p2.x + 2, 0);
                }
            });

        ctx.strokeStyle = '#000';
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}
