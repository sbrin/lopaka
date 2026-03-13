import { Point } from '../../core/point';
import { PolygonLayer } from '../../core/layers/polygon.layer';
import { DrawPlugin } from './draw.plugin';

export class ResizeIconsPlugin extends DrawPlugin {
    private static readonly MARKER_SIZE = 12;
    private static readonly MARKER_RADIUS = ResizeIconsPlugin.MARKER_SIZE / 2;

    update(ctx: CanvasRenderingContext2D, _point: Point, _event: MouseEvent | TouchEvent) {
        const { scale } = this.session.state;
        const { interfaceColors } = this.session.getPlatformFeatures();
        const { layersManager } = this.session;
        const resizableLayers = layersManager.selected.filter((l) => l.resizable);
        if (resizableLayers.length == 1) {
            ctx.save();
            const layer = resizableLayers[0];
            const event = _event || ({ shiftKey: this.session.editor.state.shiftPressed } as unknown as MouseEvent);
            const editPoints = layer.getEditPoints(event);
            if (layer instanceof PolygonLayer && layer.vertexEditMode) {
                this.drawVertexMarkers(ctx, editPoints, scale, interfaceColors);
            } else {
                this.drawResizeMarkers(ctx, editPoints, scale, interfaceColors);
            }

            ctx.restore();
        }
    }

    private drawResizeMarkers(ctx: CanvasRenderingContext2D, editPoints: any[], scale: Point, interfaceColors: any) {
        ctx.beginPath();
        editPoints.forEach((editPoint) => {
            const r = editPoint.getRect().multiply(scale).round();
            const c = r.getCenter();
            ctx.rect(
                c.x - ResizeIconsPlugin.MARKER_RADIUS,
                c.y - ResizeIconsPlugin.MARKER_RADIUS,
                ResizeIconsPlugin.MARKER_SIZE,
                ResizeIconsPlugin.MARKER_SIZE
            );
        });
        ctx.strokeStyle = interfaceColors.resizeIconColor;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    private drawVertexMarkers(ctx: CanvasRenderingContext2D, editPoints: any[], scale: Point, interfaceColors: any) {
        ctx.beginPath();
        editPoints.forEach((editPoint) => {
            const r = editPoint.getRect().multiply(scale).round();
            const c = r.getCenter().add(scale.x / 2, scale.y / 2);
            ctx.moveTo(c.x + ResizeIconsPlugin.MARKER_RADIUS, c.y);
            ctx.arc(c.x, c.y, ResizeIconsPlugin.MARKER_RADIUS, 0, Math.PI * 2);
        });
        ctx.strokeStyle = interfaceColors.resizeIconColor;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
