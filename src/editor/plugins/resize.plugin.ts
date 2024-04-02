import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class ResizePlugin extends AbstractEditorPlugin {
    captured: boolean = false;
    resizeLayer: AbstractLayer = null;

    getPadding() {
        const {scale} = this.session.state;
        return new Rect(-8, -8, 16, 16).divide(scale).round();
    }

    onMouseDown(point: Point, event: MouseEvent): void {
        const {activeTool} = this.session.editor.state;
        if (activeTool) return;
        const {layers} = this.session.state;
        const resizableLayers = layers.filter(
            (layer) => layer.resizable && layer.selected && layer.bounds.clone().add(this.getPadding()).contains(point)
        );
        if (resizableLayers.length == 1) {
            const layer = resizableLayers[0];
            if (layer && layer.editPoints.length) {
                const editPoint = layer.editPoints.find((editPoint) => editPoint.getRect().contains(point));
                if (editPoint) {
                    this.captured = true;
                    this.resizeLayer = layer;
                    layer.startEdit(EditMode.RESIZING, point, editPoint);
                }
            }
        }
    }

    onMouseMove(point: Point, event: MouseEvent): void {
        if (this.captured) {
            this.resizeLayer.edit(point, event);
            this.session.virtualScreen.redraw();
        } else {
            const {activeTool} = this.session.editor.state;
            if (activeTool) return;
            const {layers} = this.session.state;
            const resizableLayers = layers.filter(
                (layer) =>
                    layer.resizable && layer.selected && layer.bounds.clone().add(this.getPadding()).contains(point)
            );
            if (resizableLayers.length == 1) {
                const layer = resizableLayers[0];
                if (layer && layer.editPoints.length) {
                    const editPoint = layer.editPoints.find((editPoint) => editPoint.getRect().contains(point));
                    if (editPoint) {
                        this.container.style.cursor = editPoint.cursor;
                        return;
                    }
                }
            }
            this.container.style.cursor = '';
        }
    }

    onMouseUp(point: Point, event: MouseEvent): void {
        if (this.captured) {
            this.captured = false;
            this.resizeLayer.stopEdit();
        }
    }
}
