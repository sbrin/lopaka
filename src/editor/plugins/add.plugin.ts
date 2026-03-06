import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {Keys} from '../../core/keys.enum';
import {Point} from '../../core/point';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class AddPlugin extends AbstractEditorPlugin {
    firstPoint: Point;
    captured: boolean = false;
    multiClickActive: boolean = false;

    onMouseDown(point: Point, event: MouseEvent): void {
        const {state} = this.session.editor;
        const {layers} = this.session.state;

        if (this.multiClickActive && state.activeLayer && state.activeTool) {
            this.captured = true;
            state.activeLayer.startEdit(EditMode.CREATING, point);
            state.activeTool.onStartEdit(state.activeLayer as AbstractLayer, point, event);
            this.session.virtualScreen.redraw(false);
            return;
        }

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
        if (this.captured || this.multiClickActive) {
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

            if (activeTool?.isMultiClick()) {
                activeLayer.stopEdit();
                this.multiClickActive = true;
                this.session.virtualScreen.redraw(false);
                return;
            }

            activeLayer.stopEdit();
            activeTool.onStopEdit(activeLayer as AbstractLayer, point, event);
            activeLayer.selected = true;
            this.session.virtualScreen.redraw();
        }
    }

    onMouseDoubleClick(point: Point, event: MouseEvent): void {
        if (this.multiClickActive) {
            const {state} = this.session.editor;
            const {activeLayer, activeTool} = state;
            this.multiClickActive = false;
            this.captured = false;
            if (activeLayer && activeTool) {
                activeTool.onStopEdit(activeLayer as AbstractLayer, point, event);
                activeLayer.stopEdit();
                activeLayer.draw();
                activeLayer.selected = true;
                state.activeLayer = null;
                state.activeTool = null;
                this.session.virtualScreen.redraw();
            }
        }
    }

    onKeyDown(key: Keys, event: KeyboardEvent): void {
        if (key === Keys.Escape && this.multiClickActive) {
            const {state} = this.session.editor;
            const {activeLayer, activeTool} = state;
            this.multiClickActive = false;
            this.captured = false;
            if (activeLayer && activeTool) {
                activeTool.onStopEdit(activeLayer as AbstractLayer, null, null);
                activeLayer.stopEdit();
                activeLayer.draw();
                if ((activeLayer as any).points?.length >= 3) {
                    activeLayer.selected = true;
                } else {
                    this.session.removeLayer(activeLayer as AbstractLayer);
                }
                state.activeLayer = null;
                state.activeTool = null;
                this.session.virtualScreen.redraw();
            }
        }
    }

    onClear(): void {
        this.multiClickActive = false;
        this.captured = false;
    }
}
