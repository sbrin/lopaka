import {Point} from '../../core/point';
import {DrawPlugin} from './draw.plugin';

export class ResizeIconsPlugin extends DrawPlugin {
    private iconSize: number = 3;
    update(ctx: CanvasRenderingContext2D, point: Point) {
        this.session.state.layers
            .filter((l) => l.resizable && l.selected)
            .forEach((layer) => {
                const {bounds} = layer;
                const {scale} = this.session.state;
                ctx.save();
                const position = new Point(bounds.xy).multiply(scale);
                const size = new Point(bounds.wh).multiply(scale);
                ctx.beginPath();
                // NW
                ctx.moveTo(position.x, position.y);
                ctx.arc(position.x, position.y, this.iconSize, 0, 2 * Math.PI);
                // NE
                ctx.moveTo(position.x + size.x, position.y);
                ctx.arc(position.x + size.x, position.y, this.iconSize, 0, 2 * Math.PI);
                // SW
                ctx.moveTo(position.x, position.y + size.y);
                ctx.arc(position.x, position.y + size.y, this.iconSize, 0, 2 * Math.PI);
                // SE
                ctx.moveTo(position.x + size.x, position.y + size.y);
                ctx.arc(position.x + size.x, position.y + size.y, this.iconSize, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fill();
                ctx.restore();
            });
    }
}
