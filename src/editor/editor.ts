import {Keys} from '../core/keys.enum';
import {Point} from '../core/point';
import {Rect} from '../core/rect';
import {Session} from '../core/session';
import {CopyPlugin} from './plugins/copy.plugin';
import {DeletePlugin} from './plugins/delete.plugin';
import {EditorPlugin} from './plugins/editor.plugin';
import {LayersPlugin} from './plugins/layers.plugin';
import {MovePlugin} from './plugins/move.plugin';
import {SelectionPlugin} from './plugins/selection.plugin';

export class Editor {
    plugins: EditorPlugin[] = [];
    container: HTMLElement;

    constructor(protected session: Session) {}

    setContainer(container: HTMLElement) {
        this.container = container;
        this.plugins.push(
            ...[
                new LayersPlugin(this.session, this.container),
                new SelectionPlugin(this.session, this.container),
                new CopyPlugin(this.session, this.container),
                new MovePlugin(this.session, this.container),
                new DeletePlugin(this.session, this.container)
            ]
        );
    }

    handleEvent = (event: MouseEvent | KeyboardEvent) => {
        const {virtualScreen, state} = this.session;
        const {display, scale, layers} = state;
        if (event instanceof KeyboardEvent) {
            if (Object.values(Keys).indexOf(event.code as Keys) != -1) {
                event.preventDefault();
                this.onKeyDown(Keys[event.code], event);
            }
        } else if (event instanceof MouseEvent) {
            const screenPoint = new Point(event.offsetX, event.offsetY).clone();
            const point = screenPoint.clone().divide(scale).round().boundTo(new Rect(new Point(), display));
            switch (event.type) {
                case 'click':
                    this.onMouseClick(point, event);
                    break;
                case 'mousedown':
                    this.onMouseDown(point, event);
                    break;
                case 'mousemove':
                    this.onMouseMove(point, event);
                    break;
                case 'mouseup':
                    this.onMouseUp(point, event);
                    break;
                case 'mouseleave':
                    this.onMouseLeave(point, event);
                    break;
            }
            virtualScreen.updateMousePosition(screenPoint);
        }
    };

    onMouseClick(point: Point, event: MouseEvent): void {
        this.plugins.forEach((plugin) => plugin.onMouseClick(point, event));
    }
    onMouseDown(point: Point, event: MouseEvent): void {
        this.plugins.forEach((plugin) => plugin.onMouseDown(point, event));
    }
    onMouseMove(point: Point, event: MouseEvent): void {
        this.plugins.forEach((plugin) => plugin.onMouseMove(point, event));
    }
    onMouseUp(point: Point, event: MouseEvent): void {
        this.plugins.forEach((plugin) => plugin.onMouseUp(point, event));
    }
    onMouseLeave(point: Point, event: MouseEvent): void {
        this.plugins.forEach((plugin) => plugin.onMouseLeave(point, event));
    }
    onKeyDown(key: Keys, event: KeyboardEvent): void {
        this.plugins.forEach((plugin) => plugin.onKeyDown(key, event));
    }
}
