import {DrawPlugin} from './draw.plugin';

export class SmartRulerPlugin extends DrawPlugin {
    public update(ctx: CanvasRenderingContext2D): void {
        const {layers, scale} = this.session.state;
        const offset = DrawPlugin.offset.clone();
        // show distance to left and top
        ctx.save();
        ctx.translate(0.5, 0.5);
        ctx.beginPath();
        ctx.font = '10px sans-serif';
        layers
            .filter((layer) => layer.selected)
            .forEach((layer) => {
                const p1 = layer.bounds.pos.clone().multiply(scale).round();
                const p2 = layer.bounds.size.clone().multiply(scale).add(p1).round();
                // horizontal line p1
                ctx.moveTo(-9, p1.y);
                ctx.lineTo(p1.x, p1.y);

                ctx.textBaseline = 'middle';
                ctx.textAlign = 'right';
                ctx.fillText(`${layer.bounds.y}`, -12, p1.y);
                // vertical line p1
                ctx.moveTo(p1.x, -9);
                ctx.lineTo(p1.x, p1.y);
                ctx.textBaseline = 'bottom';
                ctx.textAlign = 'center';
                ctx.fillText(`${layer.bounds.x}`, p1.x, -12);
                if (Math.abs(p1.distanceTo(p2)) > 10) {
                    // horizontal line p2
                    ctx.moveTo(-9, p2.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'right';
                    ctx.fillText(`${Math.round(layer.bounds.h + layer.bounds.y)}`, -12, p2.y);
                    // vertical line p2
                    ctx.moveTo(p2.x, -9);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.textBaseline = 'bottom';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${Math.round(layer.bounds.w + layer.bounds.x)}`, p2.x, -12);
                }
            });

        ctx.strokeStyle = '#000';
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}
