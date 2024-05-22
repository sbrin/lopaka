import {TPlatformFeatures} from '../../platforms/platform';
import {Point} from '../point';
import {Rect} from '../rect';
import {EditMode} from './abstract.layer';
import {RectangleLayer} from './rectangle.layer';

export class DotLayer extends RectangleLayer {
    protected type: ELayerType = 'dot';
    protected brushSize: Point = new Point(1);
    public resizable: boolean = false;

    constructor(protected features: TPlatformFeatures) {
        super(features);
        delete this.modifiers.w;
        delete this.modifiers.h;
        delete this.modifiers.fill;
        delete this.modifiers.radius;
        if (!this.features.hasRGBSupport) {
            delete this.modifiers.color;
        }
        if (!this.features.hasInvertedColors) {
            delete this.modifiers.inverted;
        }
        this.color = this.features.defaultColor;
        this.size = this.brushSize.clone();
    }

    edit(point: Point, originalEvent: MouseEvent) {
        const {position, editPoint, firstPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                this.position = position.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.CREATING:
                this.position = point.clone();
                break;
        }
        this.updateBounds();
        this.draw();
    }

    draw(): void {
        const {dc, position, size} = this;
        dc.clear();
        dc.ctx.fillStyle = this.color;
        dc.ctx.strokeStyle = this.color;
        dc.ctx.beginPath();
        dc.ctx.rect(position.x, position.y, size.x, size.y);
        dc.ctx.fill();
    }

    updateBounds(): void {
        this.bounds = new Rect(this.position, this.size.clone());
    }
}
