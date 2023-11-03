import {Keys} from '../../core/keys.enum';
import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {Session} from '../../core/session';
import {EditorPlugin} from './editor.plugin';

export class SelectionPlugin extends EditorPlugin {
    captured: boolean = false;
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
        const {activeTool, layers, scale} = this.session.state;
        if (!activeTool) {
            const selected = layers.filter((l) => l.selected);
            const hovered = layers.filter((l) => l.contains(point));
            if (hovered.length) {
                // if there is a hovered layer
                const upperLayer = hovered[0];
                // add or remove from selection if ctrl or cmd is pressed
                if (event.ctrlKey || event.metaKey) {
                    upperLayer.selected = !upperLayer.selected;
                } else if (!upperLayer.selected) {
                    // if layer is not selected, select it and unselect others
                    this.session.state.layers.forEach((l) => (l.selected = false));
                    upperLayer.selected = true;
                }
            } else if (event.metaKey || event.ctrlKey) {
                // if there is no hovered layer and ctrl or cmd is pressed, start box selection
                this.captured = true;
                this.firstPoint = point.clone();
                const screenPoint = point.clone().multiply(scale);
                Object.assign(this.selectionElement.style, {
                    display: 'block',
                    left: `${screenPoint.x}px`,
                    top: `${screenPoint.y}px`,
                    width: '0px',
                    height: '0px'
                });
            } else {
                selected.forEach((layer) => (layer.selected = false));
            }
        }
    }

    onMouseMove(point: Point, event: MouseEvent): void {
        if (this.captured) {
            const {scale} = this.session.state;
            const screenPoint = point.clone().multiply(scale);
            const position = this.firstPoint.clone().multiply(scale).min(screenPoint);
            const size = point.clone().subtract(this.firstPoint).abs().multiply(scale);
            Object.assign(this.selectionElement.style, {
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.x}px`,
                height: `${size.y}px`
            });
        }
    }

    onMouseUp(point: Point, event: MouseEvent): void {
        if (this.captured) {
            const {layers} = this.session.state;
            this.captured = false;
            this.selectionElement.style.display = 'none';
            const position = this.firstPoint.clone().min(point);
            const size = point.clone().subtract(this.firstPoint).abs();
            layers.forEach((l) => (l.selected = new Rect(position, size).intersect(l.bounds)));
        }
    }

    onKeyDown(key: Keys, event: KeyboardEvent): void {
        if (key === Keys.Escape) {
            event.preventDefault();
            this.session.state.layers.forEach((l) => (l.selected = false));
            this.session.virtualScreen.redraw();
        } else if (key === Keys.KeyA && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            this.session.state.layers.forEach((l) => (l.selected = true));
            this.session.virtualScreen.redraw();
        }
    }
}
