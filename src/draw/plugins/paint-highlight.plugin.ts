import {PaintLayer} from '../../core/layers/paint.layer';
import {Point} from '../../core/point';
import {AbstractEditorPlugin} from '../../editor/plugins/abstract-editor.plugin';
import {PaintPlugin} from '../../editor/plugins/paint.plugin';
import {DrawPlugin} from './draw.plugin';

export class PaintHighlightPlugin extends DrawPlugin {
    paintEditorPlugin: PaintPlugin;

    public update(ctx: CanvasRenderingContext2D, point: Point, event: MouseEvent): void {
        if (!this.paintEditorPlugin) {
            this.paintEditorPlugin = this.session.editor.plugins.find(
                (p: AbstractEditorPlugin) => p instanceof PaintPlugin
            ) as PaintPlugin;
        }
        const {display, scale} = this.session.state;
        if (point) {
            if (
                event.shiftKey &&
                this.session.editor.state.activeLayer &&
                this.session.editor.state.activeLayer instanceof PaintLayer &&
                this.paintEditorPlugin.lastPoint
            ) {
                console.log('paint highlight', point, this.paintEditorPlugin.lastPoint);
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(this.paintEditorPlugin.lastPoint.x * scale.x, this.paintEditorPlugin.lastPoint.y * scale.y);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.setLineDash([5, 5]);
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }
        }
    }
}
