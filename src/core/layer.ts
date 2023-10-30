import {reactive} from 'vue';
import {DrawContext} from '../draw/draw-context';
import {generateUID} from '../utils';
import {Point} from './point';
import {Rect} from './rect';

export class Layer {
    name: string;
    position: Point = new Point();
    size: Point = new Point();
    data: any = reactive({});
    id: string = generateUID();
    isOverlay: boolean = false;
    edititng: boolean = false;
    buffer: OffscreenCanvas = new OffscreenCanvas(0, 0);
    dc: DrawContext = new DrawContext(this.buffer);
    bounds: Rect = new Rect();

    public isStub() {
        return this.index === -1;
    }

    constructor(
        public type: string,
        public index: number = -1
    ) {}

    public clone() {
        const clonedLayer = new Layer(this.type, -1);
        clonedLayer.position = this.position.clone();
        clonedLayer.size = this.size.clone();
        clonedLayer.bounds = this.bounds.clone();
        clonedLayer.data = Object.assign({}, this.data);
        clonedLayer.buffer.width = this.buffer.width;
        clonedLayer.buffer.height = this.buffer.height;
        clonedLayer.dc.ctx.fillStyle = '#000';
        clonedLayer.dc.ctx.strokeStyle = '#000';
        return clonedLayer;
    }
}
