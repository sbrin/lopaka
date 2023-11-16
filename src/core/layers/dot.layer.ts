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
    protected fill: boolean = true;
    constructor(protected features: TPlatformFeatures) {
        super(features);
        delete this.modifiers.w;
        delete this.modifiers.h;
        if (!this.features.hasCustomFontSize) {
            delete this.modifiers.fontSize;
        }
        if (!this.features.hasRGBSupport) {
            delete this.modifiers.color;
            this.color = '#000000';
        }
        if (this.features.hasInvertedColors) {
            this.color = '#FFFFFF';
        }
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
