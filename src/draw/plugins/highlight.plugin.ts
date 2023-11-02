import {Point} from '../../core/point';
import {DrawPlugin} from './draw.plugin';

export class HighlightPlugin extends DrawPlugin {
    public update(ctx: CanvasRenderingContext2D, position: Point): void {
        const {display, scale, layers} = this.session.state;
        // if (position) {
        ctx.save();
        ctx.beginPath();
        layers.forEach((layer) => {
            const bounds = layer.bounds.clone().multiply(scale).round().add(-0.5, -0.5, 1, 1);
            // console.log(bounds.xy, bounds.wh, layer.bounds.xy, layer.bounds.wh);
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
            } else if (position && layer.contains(position.clone().divide(scale).round())) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 1;
                ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
                ctx.restore();
            }
        });

        // .filter(
        //     (layer) =>
        //         layer.dc.ctx.isPointInStroke(point.x, point.y) || layer.dc.ctx.isPointInPath(point.x, point.y)
        // )
        // .forEach((layer) => {
        //     ctx.rect(
        //         bounds.x,
        //         bounds.y,
        //         bounds 1,
        // + 1
        //     );
        // });
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        // }
    }
}
