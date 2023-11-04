import {Point} from '../../core/point';
import {Session} from '../../core/session';
import {EditorPlugin} from './editor.plugin';
enum Direction {
    NE = 'NE',
    SE = 'SE',
    SW = 'SW',
    NW = 'NW'
}
export class ResizePlugin extends EditorPlugin {
    captured: boolean = false;
    resizableFrame: HTMLElement;
    constructor(
        protected session: Session,
        protected container: HTMLElement
    ) {
        super(session, container);
        // this.resizableFrame = document.createElement('div');
        // this.resizableFrame.classList.add('fui-canvas__resizable-conatiner');
        // this.container.appendChild(this.resizableFrame);
    }

    onMouseDoubleClick(point: Point, event: MouseEvent): void {
        const {activeTool, layers, scale} = this.session.state;
        if (layers.find((l) => l.isEditing())) {
            return;
        }
        const hovered = layers.filter((l) => l.contains(point)).sort((a, b) => b.index - a.index);
        if (hovered.length) {
            const upperLayer = hovered[0];
            // TODO
            // upperLayer.startEdit(EditMode.RESIZING, point);
            // const bounds = upperLayer.bounds.clone().multiply(scale);
            // if (upperLayer.resizable) {
            //     this.captured = true;
            //     this.resizableFrame.style.display = 'block';
            //     this.resizableFrame.style.left = `${bounds.x}px`;
            //     this.resizableFrame.style.top = `${bounds.y}px`;
            //     this.resizableFrame.style.width = `${bounds.w}px`;
            //     this.resizableFrame.style.height = `${bounds.h}px`;
            //     this.resizableFrame.innerHTML = '';
            //     this.addPoint(new Point(bounds.w, bounds.h), Direction.SE);
            //     this.addPoint(new Point(0, bounds.h), Direction.SW);
            //     this.addPoint(new Point(0, 0), Direction.NW);
            //     this.addPoint(new Point(bounds.w, 0), Direction.NE);
            // }
        }
    }

    // private addPoint(point: Point, direction: Direction) {
    //     const {x, y} = point;
    //     const pointElement = document.createElement('div');
    //     pointElement.classList.add('fui-canvas__movable-point', `direction_${direction}`);
    //     pointElement.style.left = `${x}px`;
    //     pointElement.style.top = `${y}px`;
    //     this.resizableFrame.appendChild(pointElement);
    // }
}
