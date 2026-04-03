import { Keys } from '../../core/keys.enum';
import { AbstractLayer, EditMode } from '../../core/layers/abstract.layer';
import { PolygonLayer } from '../../core/layers/polygon.layer';
import { TriangleLayer } from '../../core/layers/triangle.layer';
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

    private exitGeometryVertexEditMode(layer: AbstractLayer): void {
        if (layer instanceof PolygonLayer || layer instanceof TriangleLayer) {
            layer.exitVertexEditMode();
        }
    }

    private clearSelectionAndExitGeometryModes(): void {
        const { layersManager } = this.session;
        layersManager.selected.forEach((layer) => {
            this.exitGeometryVertexEditMode(layer);
        });
        layersManager.clearSelection();
    }

    onMouseDown(point: Point, event: MouseEvent | TouchEvent): void {
        this.foreign = false;
        this.grabMode = false;
        const { layersManager } = this.session;
        const { activeTool } = this.session.editor.state;
        if (!activeTool) {
            if (event.altKey) {
                this.captured = true;
                this.grabMode = true;
                this.firstPoint = point.clone();
            } else {
                const hovered = layersManager.layers
                    .filter((l) => !l.locked && l.contains(point))
                    .sort((a, b) => b.index - a.index);
                if (hovered.length) {
                    const upperLayer = hovered[0];
                    if (this.lastLayerId !== upperLayer.uid) {
                        this.selected = false;
                    }

                    if (event.shiftKey) {
                        if (upperLayer.selected) {
                            if (upperLayer.group && !this.selected) {
                                layersManager.eachLayer((l) => {
                                    if (l.group && l.group === upperLayer.group) {
                                        layersManager.selectLayer(l);
                                    }
                                });
                            } else {
                                layersManager.unselectLayer(upperLayer);
                                this.exitGeometryVertexEditMode(upperLayer);
                            }
                        } else {
                            if (upperLayer.group && !this.selected) {
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
                        this.clearSelectionAndExitGeometryModes();
                        layersManager.selectLayer(upperLayer);
                    }

                    if (!this.selected && upperLayer.group && !event.altKey) {
                        const groupLayers = layersManager.getLayersInGroup(upperLayer.group);
                        const isMultipleSelected = layersManager.selected.length > groupLayers.length;
                        if (!isMultipleSelected) {
                            this.clearSelectionAndExitGeometryModes();
                            layersManager.eachLayer((l) => {
                                if (l.group && l.group === upperLayer.group) {
                                    layersManager.selectLayer(l);
                                }
                            });
                        }
                    }
                } else {
                    this.captured = true;
                    this.selected = false;
                    this.firstPoint = point.clone();
                }
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
                    // Exit vertex edit mode for polygon layers before clearing selection
                    layersManager.selected.forEach((l) => {
                        this.exitGeometryVertexEditMode(l);
                    });
                    layersManager.clearSelection();
                    return;
                }
                shouldSelect = true;
            }
            layersManager.eachEditableLayer((l) => {
                const wasSelected = l.selected;
                if (shouldSelect) {
                    l.selected = new Rect(position, size).intersect(l.bounds);
                }

                if (this.intersect(l, position, size)) {
                    layersManager.selectLayer(l);
                } else {
                    layersManager.unselectLayer(l);
                    if (wasSelected) this.exitGeometryVertexEditMode(l);
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
                // Exit vertex edit mode for polygon layers before clearing selection
                layersManager.selected.forEach((l) => {
                    this.exitGeometryVertexEditMode(l);
                });
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
            const selectedPolygonsInVertexMode = layersManager.selected.filter(
                (layer) =>
                    (layer instanceof PolygonLayer || layer instanceof TriangleLayer) &&
                    layer.vertexEditMode
            );
            if (selectedPolygonsInVertexMode.length) {
                selectedPolygonsInVertexMode.forEach((layer) => layer.exitVertexEditMode());
                this.session.virtualScreen.redraw();
                return;
            }
            this.clearSelectionAndExitGeometryModes();
            this.session.virtualScreen.redraw();
        } else if (key === Keys.KeyA && (event.ctrlKey || event.metaKey)) {
            this.clearSelectionAndExitGeometryModes();
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
                const isAlreadyFocusedSelection =
                    layersManager.selected.length === 1 &&
                    upperLayer.selected &&
                    (!upperLayer.group ||
                        (this.selected &&
                            this.lastLayerId === upperLayer.uid));

                if (!isAlreadyFocusedSelection) {
                    this.clearSelectionAndExitGeometryModes();
                    layersManager.selectLayer(upperLayer);
                    this.selected = true;
                    this.lastLayerId = upperLayer.uid;
                } else if (upperLayer.group) {
                    this.selected = true;
                    this.lastLayerId = upperLayer.uid;
                }
            }
            this.session.editor.triggerTextEdit();
        }
    }
}
