import {Point} from '../../core/point';
import {DrawPlugin} from './draw.plugin';

export class ResizeIconsPlugin extends DrawPlugin {
    update(ctx: CanvasRenderingContext2D, point: Point) {
        const {scale, layers} = this.session.state;
        const resizableLayers = layers.filter((l) => l.resizable && l.selected);
        if (resizableLayers.length == 1) {
            ctx.save();
            ctx.beginPath();
            const layer = resizableLayers[0];
            layer.editPoints.forEach((editPoint) => {
                const r = editPoint.getRect().multiply(scale).round();
                const c = r.getCenter();
                ctx.moveTo(c.x, c.y);
                ctx.arc(c.x, c.y, 4, 0, 2 * Math.PI);
            });
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
    }
}
