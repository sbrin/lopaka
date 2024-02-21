import {TPlatformFeatures} from '../../platforms/platform';
import {Point} from '../point';
import {Rect} from '../rect';
import {EditMode} from './abstract.layer';
import {RectangleLayer} from './rectangle.layer';

export class DotLayer extends RectangleLayer {
    protected type: ELayerType = 'dot';
    protected brushSize: Point = new Point(1);
    public size: Point = this.brushSize.clone();
    public resizable: boolean = false;
    public fill: boolean = true;

    public get properties(): any {
        return {
            x: this.position.x,
            y: this.position.y,
            color: this.color,
            type: this.type,
            id: this.uid
        };
    }

    constructor(protected features: TPlatformFeatures) {
        super(features);
        delete this.modifiers.w;
        delete this.modifiers.h;
        if (!this.features.hasRGBSupport) {
            delete this.modifiers.color;
        }
        if (!this.features.hasInvertedColors) {
            delete this.modifiers.inverted;
        }
        this.color = this.features.defaultColor;
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
