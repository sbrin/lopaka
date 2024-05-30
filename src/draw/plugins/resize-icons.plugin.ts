import {Point} from '../../core/point';
import {DrawPlugin} from './draw.plugin';

export class ResizeIconsPlugin extends DrawPlugin {
    update(ctx: CanvasRenderingContext2D, point: Point) {
        const {scale} = this.session.state;
        const {layersManager} = this.session;
        const {interfaceColors} = this.session.getPlatformFeatures();
        const resizableLayers = layersManager.selected.filter((l) => l.resizable);
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
            ctx.strokeStyle = interfaceColors.resizeIconColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
    }
}
