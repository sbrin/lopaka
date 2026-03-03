import {Point} from '../../core/point';
import {PolygonLayer} from '../../core/layers/polygon.layer';
import {DrawPlugin} from './draw.plugin';

export class ResizeIconsPlugin extends DrawPlugin {
    update(ctx: CanvasRenderingContext2D, point: Point) {
        const {scale, layers} = this.session.state;
        const {interfaceColors} = this.session.getPlatformFeatures();
        const resizableLayers = layers.filter((l) => l.resizable && l.selected && !l.locked);
        if (resizableLayers.length == 1) {
            ctx.save();
            const layer = resizableLayers[0];
            const isVertexMode = layer instanceof PolygonLayer && layer.vertexEditMode;

            ctx.beginPath();
            layer.editPoints.forEach((editPoint) => {
                const r = editPoint.getRect().multiply(scale).round();
                const c = r.getCenter();
                ctx.moveTo(c.x + (isVertexMode ? 5 : 4), c.y);
                ctx.arc(c.x, c.y, isVertexMode ? 5 : 4, 0, 2 * Math.PI);
            });

            if (isVertexMode) {
                ctx.fillStyle = interfaceColors.resizeIconColor;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                ctx.strokeStyle = interfaceColors.resizeIconColor;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            ctx.restore();
        }
    }
}
