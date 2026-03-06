import {AbstractLayer, EditMode, TLayerEditPoint} from '../../core/layers/abstract.layer';
import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

const RESIZE_HANDLE_HIT_AREA_MULTIPLIER = 2;

export class ResizePlugin extends AbstractEditorPlugin {
    captured: boolean = false;
    resizeLayer: AbstractLayer = null;

    getPadding() {
        const {scale} = this.session.state;
        return new Rect(-8, -8, 16, 16).divide(scale).round();
    }

    private getResizableLayerAtPoint(point: Point): AbstractLayer | null {
        // Keep resize interactions limited to one visible and editable selected layer.
        const {layersManager} = this.session;
        const resizableLayers = layersManager.selected.filter(
            (layer) =>
                layer.resizable &&
                !layer.locked &&
                !layer.hidden &&
                layer.bounds.clone().add(this.getPadding()).contains(point)
        );
        return resizableLayers.length === 1 ? resizableLayers[0] : null;
    }

    private getExpandedEditPointRect(editPoint: TLayerEditPoint): Rect {
        // Expand handle hit area around its center to improve pointer targeting.
        const baseRect = editPoint.getRect();
        const widthDelta = baseRect.w * (RESIZE_HANDLE_HIT_AREA_MULTIPLIER - 1);
        const heightDelta = baseRect.h * (RESIZE_HANDLE_HIT_AREA_MULTIPLIER - 1);
        return baseRect
            .clone()
            .subtract(widthDelta / 2, heightDelta / 2, -widthDelta, -heightDelta);
    }

    private getEditPointAtPointer(
        layer: AbstractLayer,
        point: Point,
        event: MouseEvent | TouchEvent
    ): TLayerEditPoint | undefined {
        // Resolve modifier-aware edit points and match them against expanded hit zones.
        const editPoints = layer.getEditPoints(event);
        return editPoints.find((editPoint) => this.getExpandedEditPointRect(editPoint).contains(point));
    }

    onMouseDown(point: Point, event: MouseEvent | TouchEvent): void {
        const {activeTool} = this.session.editor.state;
        if (activeTool) return;
        // Find a single eligible layer under the pointer before starting resize.
        const layer = this.getResizableLayerAtPoint(point);
        if (!layer || !layer.editPoints.length) return;
        // Use the expanded handle hit area when selecting the edit point.
        const editPoint = this.getEditPointAtPointer(layer, point, event);
        if (!editPoint) return;
        this.captured = true;
        this.resizeLayer = layer;
        layer.startEdit(EditMode.RESIZING, point, editPoint);
    }

    onMouseMove(point: Point, event: MouseEvent | TouchEvent): void {
        if (this.captured) {
            // Forward drag updates to the captured resize layer.
            this.resizeLayer.edit(point, event);
            this.session.virtualScreen.redraw();
            return;
        }
        const {activeTool} = this.session.editor.state;
        if (activeTool) return;
        // Find a single eligible layer to show resize cursor hints.
        const layer = this.getResizableLayerAtPoint(point);
        if (!layer || !layer.editPoints.length) {
            this.container.style.cursor = '';
            return;
        }
        // Resolve cursor from the expanded edit-point hit area.
        const editPoint = this.getEditPointAtPointer(layer, point, event);
        this.container.style.cursor = editPoint ? editPoint.cursor : '';
    }

    onMouseUp(point: Point, event: MouseEvent | TouchEvent): void {
        if (this.captured) {
            this.captured = false;
            this.resizeLayer.stopEdit();
        }
    }
}
