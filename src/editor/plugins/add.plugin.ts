import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {Point} from '../../core/point';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

/**
 * Add layer plugin
 */
export class AddPlugin extends AbstractEditorPlugin {
    firstPoint: Point;
    captured: boolean = false;

    onMouseDown(point: Point, event: MouseEvent): void {
        const {state} = this.session.editor;
        const {layers} = this.session.state;
        if (!state.activeTool || state.activeLayer) {
            return;
        }
        if (layers.find((l) => l.isEditing())) {
            return;
        } else {
            this.captured = true;
            layers.forEach((l) => (l.selected = false));
            state.activeLayer = state.activeTool.createLayer();
            this.session.addLayer(state.activeLayer as AbstractLayer);
            state.activeLayer.startEdit(EditMode.CREATING, point);
            state.activeTool.onStartEdit(state.activeLayer as AbstractLayer, point, event);
            this.session.virtualScreen.redraw(false);
        }
    }

    onMouseMove(point: Point, event: MouseEvent): void {
        if (this.captured) {
            const {activeLayer} = this.session.editor.state;
            if (!activeLayer) return;
            activeLayer.edit(point, event);
            this.session.virtualScreen.redraw(false);
        }
    }

    onMouseUp(point: Point, event: MouseEvent): void {
        if (this.captured) {
            const {activeLayer, activeTool} = this.session.editor.state;
            this.captured = false;
            if (!activeLayer) return;
            activeLayer.stopEdit();
            activeTool.onStopEdit(activeLayer as AbstractLayer, point, event);
            activeLayer.selected = true;
            this.session.virtualScreen.redraw();
        }
    }
}
