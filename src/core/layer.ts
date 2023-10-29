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
}
