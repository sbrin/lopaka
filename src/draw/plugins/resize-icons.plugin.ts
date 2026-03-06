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
            ctx.beginPath();
            const layer = resizableLayers[0];
            // Resolve handles from persistent editor modifier state instead of transient pointer events.
            const editPoints = layer.getEditPoints({ shiftKey: this.session.editor.state.shiftPressed } as MouseEvent);
            editPoints.forEach((editPoint) => {
                const r = editPoint.getRect().multiply(scale).round();
                const c = r.getCenter();
                ctx.rect(c.x - 5, c.y - 5, 10, 10);
            });
            ctx.strokeStyle = interfaceColors.resizeIconColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
    }
}
