import {DrawContext} from '../draw/draw-context';
import {generateUID} from '../utils';
import {Point} from './point';

async function packImageData(imageData: ImageData): Promise<string> {
    // todo
    return '';
}

function unpackImageData(data: string): ImageData {
    // todo
    return new ImageData(0, 0);
}

export class Layer {
    name: string;
    position: Point = new Point();
    size: Point = new Point();
    data: any;
    id: string = generateUID();
    isOverlay: boolean = false;
    edititng: boolean = false;
    buffer: OffscreenCanvas = new OffscreenCanvas(0, 0);
    dc: DrawContext = new DrawContext(this.buffer);

    constructor(
        public type: string,
        public index: number
    ) {}
}

// export class Layer {
//     name: string;
//     position: Point = new Point();
//     size: Point = new Point();
//     data: any;
//     id: string = generateUID();

//     constructor(
//         public type: string,
//         public index: number
//     ) {}

//     pack() {
//         return {
//             n: this.name,
//             p: this.position.pack(),
//             s: this.size.pack(),
//             d: this.data,
//             i: this.id,
//             t: this.type,
//             x: this.index
//         };
//     }

//     static unpack(data: any) {
//         const layer = new Layer(data.t, data.x);
//         layer.name = data.n;
//         layer.position = Point.unpack(data.p);
//         layer.size = Point.unpack(data.s);
//         layer.data = data.d;
//         layer.id = data.i;
//         layer.index = data.x;
//         return layer;
//     }
// }
