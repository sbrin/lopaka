import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {Point} from '../../core/point';
import {AbstractEditorPlugin} from './abstract-editor.plugin';
import {TextLayer} from '/src/core/layers/text.layer';
import {TextAreaLayer} from '/src/core/layers/text-area.layer';

/**
 * Add layer plugin
 */
export class AddPlugin extends AbstractEditorPlugin {
    firstPoint: Point;
    captured: boolean = false;

    onMouseDown(point: Point, event: MouseEvent | TouchEvent): void {
        const {state} = this.session.editor;
        const {layersManager} = this.session;
        // Ignore creation when no creation-capable tool is active.
        if (!state.activeTool) {
            return;
        }
        // Block creation only while an in-progress edit session exists.
        if (state.activeLayer?.isEditing()) {
            return;
        }
        if (layersManager.sorted.find((l) => l.isEditing())) {
            return;
        } else {
            this.captured = true;
            layersManager.clearSelection();
            state.activeLayer = state.activeTool.createLayer();
            const features = this.session.getPlatformFeatures();
            if (!features.hasRGBSupport && !features.hasIndexedColors) {
                state.activeLayer.color = features.defaultColor;
            } else {
                state.activeLayer.color = this.session.editor.lastColor ?? this.session.state.brushColor;
            }
            this.session.addLayer(state.activeLayer as AbstractLayer);
            state.activeLayer.startEdit(EditMode.CREATING, point);
            state.activeTool.onStartEdit(state.activeLayer as AbstractLayer, point, event);
            this.session.virtualScreen.redraw();
        }
    }

    onMouseMove(point: Point, event: MouseEvent | TouchEvent): void {
        if (this.captured) {
            const {activeLayer} = this.session.editor.state;
            if (!activeLayer) return;
            activeLayer.edit(point, event);
            this.session.virtualScreen.redraw();
        }
    }

    /**
     * Handles mouse up events after layer creation.
     *
     * For text layers specifically:
     * - Completes the layer creation process
     * - Automatically triggers text editing mode via triggerTextEdit()
     * - This allows users to immediately start typing after creating a text layer
     * - Works in conjunction with Inspector component's reactive text editing system
     */
    onMouseUp(point: Point, event: MouseEvent | TouchEvent): void {
        if (this.captured) {
            const {activeLayer, activeTool} = this.session.editor.state;
            this.captured = false;
            if (!activeLayer) return;
            activeLayer.stopEdit();
            activeTool.onStopEdit(activeLayer as AbstractLayer, point, event);
            this.session.layersManager.selectLayer(activeLayer as AbstractLayer);
            this.session.virtualScreen.redraw();

            // Trigger text editing mode for newly created text-based layers.
            if (activeLayer instanceof TextLayer || activeLayer instanceof TextAreaLayer) {
                this.session.editor.triggerTextEdit();
            }
        }
    }
}
