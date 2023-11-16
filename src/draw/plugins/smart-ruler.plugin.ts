import {DrawPlugin} from './draw.plugin';

export class SmartRulerPlugin extends DrawPlugin {
    public update(ctx: CanvasRenderingContext2D): void {
        const {layers, scale, display} = this.session.state;
        const selected = layers.filter((layer) => layer.selected || layer.isEditing());
        const features = this.session.getPlatformFeatures();
        const textColor = '#ff8200';
        const lineColor = features.hasInvertedColors ? '#955B2F' : '#000000';
        if (selected.length) {
            // show distance to left and top
            ctx.save();
            ctx.beginPath();
            ctx.font = '10px sans-serif';
            const maxPoint = display.clone().multiply(scale).round();
            const bounds = selected.reduce((bounds, layer) => bounds.extends(layer.bounds), selected[0].bounds);
            const p1 = bounds.pos.clone().multiply(scale).round().add(0.5, 0.5);
            const p2 = bounds.size.clone().multiply(scale).add(p1).round().subtract(0.5, 0.5);
            // horizontal line p1
            ctx.moveTo(-9, p1.y);
            ctx.lineTo(maxPoint.x, p1.y);

            ctx.fillStyle = textColor;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'right';
            ctx.fillText(`${bounds.y}`, -12, p1.y);
            // vertical line p1
            ctx.moveTo(p1.x, -9);
            ctx.lineTo(p1.x, maxPoint.y);
            ctx.textBaseline = 'bottom';
            ctx.textAlign = 'center';
            ctx.fillText(`${bounds.x}`, p1.x, -12);
            if (Math.abs(p1.distanceTo(p2)) > 10) {
                // horizontal line p2
                ctx.moveTo(-9, p2.y);
                ctx.lineTo(maxPoint.x, p2.y);
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'right';
                ctx.fillText(`${Math.round(bounds.h + bounds.y)}`, -12, p2.y);
                // vertical line p2
                ctx.moveTo(p2.x, -9);
                ctx.lineTo(p2.x, maxPoint.y);
                ctx.textBaseline = 'bottom';
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.round(bounds.w + bounds.x)}`, p2.x, -12);
            }
            ctx.strokeStyle = lineColor;
            ctx.setLineDash([2, 4]);
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
    }
}
