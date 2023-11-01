import {Point} from '../../core/point';
import {VirtualScreenPlugin} from './virtual-screen.plugin';

export class HighlightPlugin extends VirtualScreenPlugin {
    public update(ctx: CanvasRenderingContext2D, position: Point): void {
        const {display, scale, layers} = this.session.state;
        if (position) {
            const point = position.clone().divide(scale).round();
            ctx.save();
            ctx.beginPath();
            layers
                .filter(
                    (layer) =>
                        layer.dc.ctx.isPointInStroke(point.x, point.y) || layer.dc.ctx.isPointInPath(point.x, point.y)
                )
                .forEach((layer) => {
                    ctx.rect(
                        layer.bounds.x * scale.x - 0.5,
                        layer.bounds.y * scale.y - 0.5,
                        layer.bounds.w * scale.x + 1,
                        layer.bounds.h * scale.y + 1
                    );
                });
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
    }
}
