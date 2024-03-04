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
        const {interfaceColors} = this.session.getPlatformFeatures();
        if (point) {
            if (
                event.shiftKey &&
                this.session.editor.state.activeLayer &&
                this.session.editor.state.activeLayer instanceof PaintLayer &&
                this.paintEditorPlugin.lastPoint
            ) {
                if (point) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(0, point.y);
                    ctx.lineTo(display.x * scale.x, point.y);
                    ctx.moveTo(point.x, 0);
                    ctx.lineTo(point.x, display.y * scale.y);
                    ctx.strokeStyle = interfaceColors.selectionStrokeColor;
                    ctx.setLineDash([5, 5]);
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.beginPath();
                    const lastPoint = this.paintEditorPlugin.lastPoint
                        .clone()
                        .multiply(scale)
                        .add(scale.x / 2);
                    ctx.moveTo(lastPoint.x, lastPoint.y);
                    ctx.lineTo(point.x, point.y);
                    ctx.strokeStyle = interfaceColors.selectionStrokeColor;
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
    }
}
