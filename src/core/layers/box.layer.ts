import {RectangleLayer} from './rectangle.layer';

export class BoxLayer extends RectangleLayer {
    protected type: ELayerType = 'box';
    constructor() {
        super(true);
    }
}
