import {Point} from '../../core/point';
import {EditorPlugin} from './editor.plugin';

export class LayersPlugin extends EditorPlugin {
    firstPoint: Point;
    captured: boolean = false;

    onMouseDown(point: Point, event: MouseEvent): void {
        const {activeTool, layers} = this.session.state;
        if (!activeTool) {
            return;
        }
        if (layers.find((l) => l.isEditing())) {
            return;
        } else {
            this.captured = true;
            activeTool.onMouseDown(point, event);
        }
    }

    onMouseMove(point: Point, event: MouseEvent): void {
        if (this.captured) {
            this.session.state.activeTool.onMouseMove(point, event);
        }
    }

    onMouseUp(point: Point, event: MouseEvent): void {
        if (this.captured) {
            this.captured = false;
            this.session.state.activeTool.onMouseUp(point, event);
        }
    }
}
