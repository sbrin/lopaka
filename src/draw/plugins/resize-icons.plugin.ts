import { Point } from '../../core/point';
import { PolygonLayer } from '../../core/layers/polygon.layer';
import { DrawPlugin } from './draw.plugin';

export class ResizeIconsPlugin extends DrawPlugin {
    update(ctx: CanvasRenderingContext2D, _point: Point, _event: MouseEvent | TouchEvent) {
        const { scale } = this.session.state;
        const { interfaceColors } = this.session.getPlatformFeatures();
        const { layersManager } = this.session;
        const resizableLayers = layersManager.selected.filter((l) => l.resizable);
        if (resizableLayers.length == 1) {
            ctx.save();
            const layer = resizableLayers[0];
            // Resolve handles from persistent editor modifier state instead of transient pointer events.
            const editPoints = layer.getEditPoints({ shiftKey: this.session.editor.state.shiftPressed } as MouseEvent);
            const isVertexMode = layer instanceof PolygonLayer && layer.vertexEditMode;

            if (isVertexMode) {
                this.drawPolygonVertexMarkers(ctx, layer, scale, interfaceColors);
            } else {
                this.drawResizeMarkers(ctx, layer, editPoints, scale, interfaceColors);
            }

            ctx.restore();
        }
    }

    private drawPolygonVertexMarkers(
        ctx: CanvasRenderingContext2D,
        layer: PolygonLayer,
        scale: Point,
        interfaceColors: any
    ) {
        ctx.beginPath();
        layer.editPoints.forEach((editPoint) => {
            const r = editPoint.getRect().multiply(scale).round();
            const c = r.getCenter();
            ctx.moveTo(c.x + 8, c.y);
            ctx.arc(c.x, c.y, 8, 0, 2 * Math.PI);
        });
        ctx.fillStyle = interfaceColors.resizeIconColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    private drawResizeMarkers(ctx: CanvasRenderingContext2D, layer: any, editPoints: any[], scale: Point, interfaceColors: any) {
        ctx.beginPath();
        editPoints.forEach((editPoint) => {
            const r = editPoint.getRect().multiply(scale).round();
            const c = r.getCenter();
            ctx.rect(c.x - 5, c.y - 5, 10, 10);
        });
        ctx.strokeStyle = interfaceColors.resizeIconColor;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
