import {Keys} from '../../core/keys.enum';
import {AbstractLayer} from '../../core/layers/abstract.layer';
import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {Session} from '../../core/session';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class SelectPlugin extends AbstractEditorPlugin {
    captured: boolean = false;
    foreign: boolean = false; // will be true if mouse down event was outside virtual screen
    selectionElement: HTMLElement;
    firstPoint: Point = null;
    selectionRect: Rect = null;

    constructor(
        protected session: Session,
        protected container: HTMLElement
    ) {
        super(session, container);
        this.selectionElement = document.createElement('div');
        this.selectionElement.classList.add('fui-canvas__selection');
        this.container.appendChild(this.selectionElement);
    }

    onMouseDown(point: Point, event: MouseEvent): void {
        this.foreign = false;
        const {layersManager} = this.session;
        const {activeTool} = this.session.editor.state;
        if (!activeTool) {
            const hovered = layersManager.contains(point).reverse();
            if (hovered.length) {
                // if there is a hovered layer
                const upperLayer = hovered[0];
                // add or remove from selection if ctrl or cmd is pressed
                if (event.ctrlKey || event.metaKey) {
                    if (upperLayer.selected) {
                        layersManager.unselectLayer(upperLayer);
                    } else {
                        layersManager.selectLayer(upperLayer);
                    }
                } else if (!upperLayer.selected) {
                    // if layer is not selected, select it and unselect others
                    layersManager.clearSelection();
                    layersManager.selectLayer(upperLayer);
                }
                // select all layers in groups
                if (upperLayer.group && !event.altKey) {
                    layersManager.clearSelection();
                    layersManager.eachLayer((l) => {
                        if (l.group && l.group === upperLayer.group) {
                            layersManager.selectLayer(l);
                        }
                    });
                }
            } else {
                // if there is no hovered layer, start box selection
                this.captured = true;
                this.firstPoint = point.clone();
            }
        }
    }

    onMouseMove(point: Point, event: MouseEvent): void {
        if (this.captured) {
            const {scale} = this.session.state;
            const {interfaceColors} = this.session.getPlatformFeatures();
            const screenPoint = point.clone().multiply(scale);
            const position = this.firstPoint.clone().multiply(scale).min(screenPoint);
            const size = point.clone().subtract(this.firstPoint).abs().multiply(scale);
            Object.assign(this.selectionElement.style, {
                display: 'block',
                borderColor: interfaceColors.selectionStrokeColor,
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.x}px`,
                height: `${size.y}px`
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

    onMouseUp(point: Point, event: MouseEvent): void {
        const {layersManager} = this.session;
        if (this.captured) {
            this.captured = false;
            this.selectionElement.style.display = 'none';
            const position = this.firstPoint.clone().min(point);
            const size = point.clone().subtract(this.firstPoint).abs();
            if (size.x < 2 && size.y < 2) {
                layersManager.clearSelection();
                return;
            }
            layersManager.eachLayer((l) => {
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
            const selected = layersManager.selected;
            const hovered = layersManager.contains(point);
            if (!hovered.length) {
                selected.forEach((layer) => layersManager.unselectLayer(layer));
            }
        }
        this.foreign = true;
    }

    onKeyDown(key: Keys, event: KeyboardEvent): void {
        const {layersManager} = this.session;
        if (this.session.editor.state.activeTool) return;
        if (key === Keys.Escape) {
            layersManager.clearSelection();
            this.session.virtualScreen.redraw();
        } else if (key === Keys.KeyA && (event.ctrlKey || event.metaKey)) {
            layersManager.eachLayer((l) => layersManager.selectLayer(l));
            this.session.virtualScreen.redraw();
        }
    }
}
