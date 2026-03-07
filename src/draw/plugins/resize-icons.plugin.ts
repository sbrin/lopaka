import { Point } from '../../core/point';
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

            const event = _event || ({ shiftKey: this.session.editor.state.shiftPressed } as unknown as MouseEvent);
            const editPoints = layer.getEditPoints(event);

            if (layer.customMarkers) {
                this.drawCustomMarkers(ctx, layer, editPoints, scale, interfaceColors);
            } else {
                this.drawResizeMarkers(ctx, layer, editPoints, scale, interfaceColors);
            }

            ctx.restore();
        }
    }

    private drawCustomMarkers(ctx: CanvasRenderingContext2D, layer: any, editPoints: any[], scale: Point, interfaceColors: any) {
        ctx.beginPath();
        editPoints.forEach((editPoint: any) => {
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
