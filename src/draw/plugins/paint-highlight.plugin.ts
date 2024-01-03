import {PaintLayer} from '../../core/layers/paint.layer';
import {Point} from '../../core/point';
import {AbstractEditorPlugin} from '../../editor/plugins/abstract-editor.plugin';
import {PaintPlugin} from '../../editor/plugins/paint.plugin';
import {DrawContext} from '../draw-context';
import {DrawPlugin} from './draw.plugin';

export class PaintHighlightPlugin extends DrawPlugin {
    paintEditorPlugin: PaintPlugin;

    public update(ctx: CanvasRenderingContext2D, point: Point, event: MouseEvent): void {
        if (!this.paintEditorPlugin) {
            this.paintEditorPlugin = this.session.editor.plugins.find(
                (p: AbstractEditorPlugin) => p instanceof PaintPlugin
            ) as PaintPlugin;
        }
        const {scale} = this.session.state;
        if (point) {
            if (
                event.shiftKey &&
                this.session.editor.state.activeLayer &&
                this.session.editor.state.activeLayer instanceof PaintLayer &&
                this.paintEditorPlugin.lastPoint
            ) {
                const lastPoint = this.paintEditorPlugin.lastPoint.clone().add(0.5).multiply(scale);
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(lastPoint.x, lastPoint.y);
                ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
                ctx.setLineDash([scale.x * 2, scale.x]);
                ctx.lineWidth = scale.x;
                ctx.stroke();
                ctx.restore();
            }
        }
    }
}
