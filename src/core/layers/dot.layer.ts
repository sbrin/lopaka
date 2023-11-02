import {Point} from '../point';
import {Rect} from '../rect';
import {EditMode} from './abstract.layer';
import {RectangleLayer} from './rectangle.layer';

export class DotLayer extends RectangleLayer {
    protected brushSize: Point = new Point(1);
    public size: Point = this.brushSize.clone();
    public resizable: boolean = false;

    constructor() {
        super(true);
        delete this.modifiers.w;
        delete this.modifiers.h;
    }

    edit(point: Point, originalEvent: MouseEvent) {
        switch (this.mode) {
            case EditMode.MOVING:
            case EditMode.CREATING:
                this.position = point.clone();
                break;
        }
        this.bounds = new Rect(this.position, this.size);
        this.draw();
    }
}
