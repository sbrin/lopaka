import { Keys } from '../../core/keys.enum';
import { AbstractLayer, EditMode } from '../../core/layers/abstract.layer';
import { Point } from '../../core/point';
import { Rect } from '../../core/rect';
import { Session } from '../../core/session';
import { AbstractEditorPlugin } from './abstract-editor.plugin';

export class SelectPlugin extends AbstractEditorPlugin {
    captured: boolean = false;
    foreign: boolean = false; // will be true if mouse down event was outside virtual screen
    selectionElement: HTMLElement;
    firstPoint: Point = null;
    selectionRect: Rect = null;
    grabMode: boolean = false;
    selected: boolean = false; // layer is selected with double click; then you can move it alone without a group
    lastLayerId: string = ''; // is used to reset selected state if clicked to other layer

    constructor(
        protected session: Session,
        protected container: HTMLElement
    ) {
        super(session, container);
        this.selectionElement = document.createElement('div');
        this.selectionElement.classList.add('fui-canvas__selection');
        this.container.appendChild(this.selectionElement);
    }

    onMouseDown(point: Point, event: MouseEvent | TouchEvent): void {
        this.foreign = false;
        this.grabMode = false;
        const { layersManager } = this.session;
        const { activeTool } = this.session.editor.state;
        if (!activeTool) {
            const hovered = layersManager.contains(point).reverse();
            if (hovered.length) {
                // if there is a hovered layer
                const upperLayer = hovered[0];
                if (this.lastLayerId !== upperLayer.uid) {
                    this.selected = false;
                }
                // add or remove from selection if shift is pressed
                if (event.shiftKey) {
                    if (upperLayer.selected) {
                        if (upperLayer.group) {
                            layersManager.eachLayer((l) => {
                                if (l.group && l.group === upperLayer.group) {
                                    layersManager.selectLayer(l);
                                }
                            });
                        } else {
                            layersManager.unselectLayer(upperLayer);
                        }
                    } else {
                        if (upperLayer.group) {
                            layersManager.eachLayer((l) => {
                                if (l.group && l.group === upperLayer.group) {
                                    layersManager.selectLayer(l);
                                }
                            });
                        } else {
                            layersManager.selectLayer(upperLayer);
                        }
                    }
                } else if (!upperLayer.selected) {
                    // if layer is not selected, select it and unselect others
                    layersManager.clearSelection();
                    layersManager.selectLayer(upperLayer);
                }
                if (!this.selected && upperLayer.group && !event.altKey) {
                    const groupLayers = layersManager.getLayersInGroup(upperLayer.group);
                    const isMultipleSelected = layersManager.selected.length > groupLayers.length;
                    if (!isMultipleSelected) {
                        layersManager.clearSelection();
                        layersManager.eachLayer((l) => {
                            if (l.group && l.group === upperLayer.group) {
                                layersManager.selectLayer(l);
                            }
                        });
                    }
                }
            } else {
                // if there is no hovered layer, start box selection
                this.captured = true;
                this.selected = false;
                this.firstPoint = point.clone();
            }
            this.session.editor.selectionUpdate();
        }
    }

    onMouseMove(point: Point, event: MouseEvent | TouchEvent): void {
        if (this.captured) {
            const { scale } = this.session.state;
            const { interfaceColors } = this.session.getPlatformFeatures();
            const screenPoint = point.clone().multiply(scale);
            const position = this.firstPoint.clone().multiply(scale).min(screenPoint);
            const size = point.clone().subtract(this.firstPoint).abs().multiply(scale);
            Object.assign(this.selectionElement.style, {
                display: 'block',
                borderColor: interfaceColors.selectionStrokeColor,
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.x}px`,
                height: `${size.y}px`,
            });
        }
    }

    private intersect(layer: AbstractLayer, position: Point, size: Point): boolean {
        const layerInBounds = new Rect(position, size).intersect(layer.bounds);
        if (layerInBounds) {
            for (let x = 0; x < size.x; x++) {
                for (let y = 0; y < size.y; y++) {
                    const point = position.clone().add(x, y);
                    if (layer.contains(point)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    onMouseUp(point: Point, event: MouseEvent | TouchEvent): void {
        const { layersManager } = this.session;
        if (this.captured) {
            // selection box logic
            let shouldSelect = false;
            this.captured = false;
            this.selectionElement.style.display = 'none';
            const position = this.firstPoint.clone().min(point);
            const size = point.clone().subtract(this.firstPoint).abs();
            if (this.grabMode) {
                this.session.grab(position, size);
            } else {
                if (size.x < 2 && size.y < 2) {
                    layersManager.clearSelection();
                    return;
                }
                shouldSelect = true;
            }
            layersManager.eachEditableLayer((l) => {
                if (shouldSelect) {
                    l.selected = new Rect(position, size).intersect(l.bounds);
                }

                if (this.intersect(l, position, size)) {
                    layersManager.selectLayer(l);
                } else {
                    layersManager.unselectLayer(l);
                }
                if (l.selected && l.group) {
                    layersManager.eachLayer((ll) => {
                        if (ll.group && ll.group === l.group) {
                            layersManager.selectLayer(ll);
                        }
                    });
                }
            });
        } else if (!this.foreign) {
            const hovered = layersManager.contains(point);
            if (!hovered.length) {
                layersManager.clearSelection();
            }
        }
        this.foreign = true;
    }

    onKeyDown(key: Keys, event: KeyboardEvent): void {
        const { layersManager } = this.session;
        this.selected = false;
        if (this.session.editor.state.activeTool) return;
        if (key === Keys.Escape) {
            layersManager.clearSelection();
            this.session.virtualScreen.redraw();
        } else if (key === Keys.KeyA && (event.ctrlKey || event.metaKey)) {
            layersManager.clearSelection();
            layersManager.eachEditableLayer((l) => layersManager.selectLayer(l));
            this.session.virtualScreen.redraw(false);
        }
    }

    /**
     * Handles double-click events on the canvas to initiate text editing mode.
     *
     * System Flow:
     * 1. Detects if user double-clicked on a selected text layer
     * 2. Sets the text layer as the active layer in the editor state
     * 3. Triggers selection update to refresh the Inspector UI
     * 4. Calls triggerTextEdit() to increment the textEditMode counter
     * 5. Inspector component reacts to textEditMode state change via Vue's reactivity
     * 6. Inspector automatically focuses and selects text in the text input field
     *
     * This approach uses reactive state management instead of direct DOM manipulation.
     */
    onMouseDoubleClick(point: Point, event: MouseEvent): void {
        const { layersManager } = this.session;
        if (layersManager.selected.length) {
            const hovered = layersManager.contains(point).reverse();
            const upperLayer = hovered[0];
            if (hovered.length) {
                layersManager.clearSelection();
                layersManager.selectLayer(upperLayer);
                this.selected = true;
                this.lastLayerId = upperLayer.uid;
            }
            this.session.editor.triggerTextEdit();
        }
    }
}
