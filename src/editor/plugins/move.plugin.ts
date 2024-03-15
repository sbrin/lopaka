import {Keys} from '../../core/keys.enum';
import {EditMode} from '../../core/layers/abstract.layer';
import {Point} from '../../core/point';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class MovePlugin extends AbstractEditorPlugin {
    firstPoint: Point;
    captured: boolean = false;

    onMouseDown(point: Point, event: MouseEvent): void {
        const {layers} = this.session.state;
        const {activeTool} = this.session.editor.state;
        // if there is an active tool or any layer is being edited, do nothing
        if (event.metaKey || event.ctrlKey || event.shiftKey || activeTool || layers.find((l) => l.isEditing())) {
            return;
        }
        const selected = layers.filter((l) => l.selected);
        const hovered = layers.filter((l) => l.contains(point));
        if (selected.length && hovered.length) {
            this.captured = true;
            selected.forEach((layer) => layer.startEdit(EditMode.MOVING, point.clone()));
        }
    }

    onMouseMove(point: Point, event: MouseEvent): void {
        if (this.captured) {
            const {layers} = this.session.state;
            layers.filter((l) => l.selected).forEach((layer) => layer.edit(point.clone(), event));
            this.session.virtualScreen.redraw();
        }
    }

    onMouseUp(point: Point, event: MouseEvent): void {
        if (this.captured) {
            const {layers} = this.session.state;
            this.captured = false;
            layers
                .filter((l) => l.isEditing())
                .forEach((layer) => {
                    layer.stopEdit();
                });
        }
    }

    onKeyDown(key: Keys, event: KeyboardEvent): void {
        if (key === Keys.ArrowDown || key === Keys.ArrowUp || key === Keys.ArrowLeft || key === Keys.ArrowRight) {
            const {layers} = this.session.state;
            const selectedLayers = layers.filter((l) => l.selected);
            if (selectedLayers.length === 0) return;
            const delta = new Point();
            const shift = event.shiftKey ? 10 : 1;
            // move layer to front / back
            if (selectedLayers.length == 1 && (event.metaKey || event.ctrlKey)) {
                switch (key) {
                    case Keys.ArrowDown: {
                        const index = layers.indexOf(selectedLayers[0]);
                        if (index > 0) {
                            layers[index] = layers[index - 1];
                            layers[index - 1] = selectedLayers[0];
                        }
                        this.session.state.layers = layers.map((l, i) => {
                            l.index = i;
                            return l;
                        });
                        break;
                    }
                    case Keys.ArrowUp: {
                        const index = layers.indexOf(selectedLayers[0]);
                        if (index < layers.length - 1) {
                            layers[index] = layers[index + 1];
                            layers[index + 1] = selectedLayers[0];
                        }
                        this.session.state.layers = layers.map((l, i) => {
                            l.index = i;
                            return l;
                        });
                        break;
                    }
                }
            } else {
                switch (key) {
                    case Keys.ArrowDown:
                        delta.y = shift;
                        break;
                    case Keys.ArrowUp:
                        delta.y = -shift;
                        break;
                    case Keys.ArrowLeft:
                        delta.x = -shift;
                        break;
                    case Keys.ArrowRight:
                        delta.x = shift;
                        break;
                }
                selectedLayers.forEach((l) => {
                    // TODO bound to screen size
                    if (l.modifiers.x && l.modifiers.y) {
                        l.modifiers.x.setValue(l.modifiers.x.getValue() + delta.x);
                        l.modifiers.y.setValue(l.modifiers.y.getValue() + delta.y);
                    } else if (l.modifiers.x1 && l.modifiers.y1 && l.modifiers.x2 && l.modifiers.y2) {
                        l.modifiers.x1.setValue(l.modifiers.x1.getValue() + delta.x);
                        l.modifiers.y1.setValue(l.modifiers.y1.getValue() + delta.y);
                        l.modifiers.x2.setValue(l.modifiers.x2.getValue() + delta.x);
                        l.modifiers.y2.setValue(l.modifiers.y2.getValue() + delta.y);
                    }
                });
            }
            this.session.virtualScreen.redraw();
        }
    }
}
