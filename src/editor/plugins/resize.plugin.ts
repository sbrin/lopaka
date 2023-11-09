import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {Point} from '../../core/point';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class ResizePlugin extends AbstractEditorPlugin {
    captured: boolean = false;
    resizeLayer: AbstractLayer = null;

    onMouseDown(point: Point, event: MouseEvent): void {
        const {activeTool} = this.session.editor.state;
        if (activeTool) return;
        const {layers} = this.session.state;
        const layer = layers.find((layer) => layer.selected && layer.contains(point));
        if (layer && layer.editPoints.length) {
            const editPoint = layer.editPoints.find((editPoint) => editPoint.getRect().contains(point));
            if (editPoint) {
                this.captured = true;
                this.resizeLayer = layer;
                layer.startEdit(EditMode.RESIZING, point, editPoint);
            }
        }
    }

    onMouseMove(point: Point, event: MouseEvent): void {
        if (this.captured) {
            this.resizeLayer.edit(point, event);
            this.session.virtualScreen.redraw();
        }
    }

    onMouseUp(point: Point, event: MouseEvent): void {
        if (this.captured) {
            this.captured = false;
            this.resizeLayer.stopEdit();
        }
    }
}
