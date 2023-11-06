import {Point} from '../../core/point';
import {DrawPlugin} from './draw.plugin';

export class HighlightPlugin extends DrawPlugin {
    public update(ctx: CanvasRenderingContext2D, point: Point): void {
        const {scale, layers} = this.session.state;
        ctx.save();
        ctx.beginPath();
        const hovered = layers
            .filter((l) => l.contains(point.clone().divide(scale).round()))
            .sort((a, b) => b.index - a.index);
        layers.forEach((layer) => {
            const bounds = layer.bounds.clone().multiply(scale).round().add(-0.5, -0.5, 1, 1);
            if (layer.isEditing()) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
                ctx.restore();
            } else if (layer.selected) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
                ctx.restore();
            } else if (hovered.length && hovered[0] === layer) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 1;
                ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
                ctx.restore();
            }
        });
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}
