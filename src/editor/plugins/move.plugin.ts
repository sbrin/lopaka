import {Keys} from '../../core/keys.enum';
import {EditMode} from '../../core/layers/abstract.layer';
import {LayerReorderEntry} from '../../core/layers-manager';
import {Point} from '../../core/point';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class MovePlugin extends AbstractEditorPlugin {
    firstPoint: Point;
    captured: boolean = false;

    onMouseDown(point: Point, event: MouseEvent | TouchEvent): void {
        const {layersManager} = this.session;
        const {activeTool} = this.session.editor.state;
        // if there is an active tool or any layer is being edited, do nothing
        if (
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            activeTool ||
            layersManager.sorted.find((l) => l.isEditing())
        ) {
            return;
        }
        const selected = layersManager.selected;
        const hovered = layersManager.contains(point);
        if (selected.length && hovered.length) {
            this.captured = true;
            this.session.history.batchStart();
            selected.forEach((layer) => layer.startEdit(EditMode.MOVING, point.clone()));
        }
    }

    onMouseMove(point: Point, event: MouseEvent | TouchEvent): void {
        if (this.captured) {
            const {layersManager} = this.session;
            layersManager.selected.forEach((layer) => layer.edit(point.clone(), event));
            this.session.virtualScreen.redraw(false);
        }
    }

    onMouseUp(point: Point, event: MouseEvent | TouchEvent): void {
        if (this.captured) {
            const {layersManager} = this.session;
            this.captured = false;
            layersManager.sorted
                .filter((l) => l.isEditing())
                .forEach((layer) => {
                    layer.stopEdit();
                });
            this.session.virtualScreen.redraw();
            this.session.history.batchEnd();
        }
    }

    onKeyDown(key: Keys, event: KeyboardEvent): void {
        if (key === Keys.ArrowDown || key === Keys.ArrowUp || key === Keys.ArrowLeft || key === Keys.ArrowRight) {
            const {layersManager} = this.session;
            const selectedLayers = layersManager.selected;
            if (selectedLayers.length === 0) return;
            const delta = new Point();
            const shift = event.shiftKey ? 10 : 1;
            // move layer to front / back
                const isSingleLayer = selectedLayers.length === 1;
                const first = selectedLayers[0];
                const groupName = first.group;
                const isSingleGroup = groupName && selectedLayers.every((l) => l.group === groupName);
                const isFullGroup =
                    isSingleGroup && layersManager.getLayersInGroup(groupName).length === selectedLayers.length;

                if ((isSingleLayer || isFullGroup) && (event.metaKey || event.ctrlKey)) {
                    // FIXME!
                    if (key === Keys.ArrowDown || key === Keys.ArrowUp) {
                        const direction = key === Keys.ArrowUp ? -1 : 1;
                        const structure: LayerReorderEntry[] = layersManager.grouped
                            .map((item) => {
                                if (Array.isArray(item)) {
                                    return {
                                        type: 'group',
                                        group: item[0].group,
                                        layers: [...item].sort((a, b) => a.index - b.index).reverse(),
                                    } as LayerReorderEntry;
                                }
                                return {
                                    type: 'layer',
                                    layer: item,
                                } as LayerReorderEntry;
                            })
                            .reverse();

                        let changed = false;

                        for (let i = 0; i < structure.length; i++) {
                            const entry = structure[i];

                            // Move entire group
                            if (isFullGroup) {
                                if (entry.type === 'group' && entry.group === groupName) {
                                    const newIndex = i + direction;
                                    if (newIndex >= 0 && newIndex < structure.length) {
                                        structure[i] = structure[newIndex];
                                        structure[newIndex] = entry;
                                        changed = true;
                                    }
                                    break;
                                }
                                continue;
                            }

                            // Move single layer
                            if (entry.type === 'layer') {
                                if (entry.layer.uid === first.uid) {
                                    const newIndex = i + direction;
                                    if (newIndex >= 0 && newIndex < structure.length) {
                                        structure[i] = structure[newIndex];
                                        structure[newIndex] = entry;
                                        changed = true;
                                    }
                                    break;
                                }
                            } else {
                                const index = entry.layers.findIndex((l) => l.uid === first.uid);
                                if (index !== -1) {
                                    const newIndex = index + direction;
                                    if (newIndex >= 0 && newIndex < entry.layers.length) {
                                        const temp = entry.layers[index];
                                        entry.layers[index] = entry.layers[newIndex];
                                        entry.layers[newIndex] = temp;
                                        changed = true;
                                    }
                                    break;
                                }
                            }
                        }

                        if (changed) {
                            layersManager.reorder(structure);
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
                        // Move the first two point pairs used by multi-point layers.
                        l.modifiers.x1.setValue(l.modifiers.x1.getValue() + delta.x);
                        l.modifiers.y1.setValue(l.modifiers.y1.getValue() + delta.y);
                        l.modifiers.x2.setValue(l.modifiers.x2.getValue() + delta.x);
                        l.modifiers.y2.setValue(l.modifiers.y2.getValue() + delta.y);
                        // Move the optional third point pair used by triangle layers.
                        if (l.modifiers.x3 && l.modifiers.y3) {
                            l.modifiers.x3.setValue(l.modifiers.x3.getValue() + delta.x);
                            l.modifiers.y3.setValue(l.modifiers.y3.getValue() + delta.y);
                        }
                    }
                });
            }
            this.session.virtualScreen.redraw();
        }
    }
}
