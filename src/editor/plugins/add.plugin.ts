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
        const {layersManager} = this.session;
        if (!state.activeTool || state.activeLayer) {
            return;
        }
        if (layersManager.sorted.find((l) => l.isEditing())) {
            return;
        } else {
            this.captured = true;
            layersManager.clearSelection();
            state.activeLayer = state.activeTool.createLayer();
            this.session.addLayer(state.activeLayer as AbstractLayer);
            state.activeLayer.startEdit(EditMode.CREATING, point);
            state.activeTool.onStartEdit(state.activeLayer as AbstractLayer, point, event);
            this.session.virtualScreen.redraw();
        }
    }

    onMouseMove(point: Point, event: MouseEvent): void {
        if (this.captured) {
            const {activeLayer} = this.session.editor.state;
            activeLayer.edit(point, event);
            this.session.virtualScreen.redraw();
        }
    }

    onMouseUp(point: Point, event: MouseEvent): void {
        if (this.captured) {
            const {activeLayer, activeTool} = this.session.editor.state;
            this.captured = false;
            activeLayer.stopEdit();
            activeTool.onStopEdit(activeLayer as AbstractLayer, point, event);
            this.session.layersManager.selectLayer(activeLayer as AbstractLayer);
            this.session.virtualScreen.redraw();
        }
    }
}
