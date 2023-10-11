import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {DrawContext} from '../draw-context';

export enum FontFormat {
    FORMAT_5x7 = 0,
    FORMAT_BDF = 1
}

export abstract class Font {
    constructor(public format: FontFormat) {
        this.loadFont();
    }

    abstract loadFont(): Promise<void>;
    abstract drawText(dc: DrawContext, text: string, position: Point, scaleFactor: number): Rect;
    // abstract getCharData(charCode: number): Uint8Array;
}
