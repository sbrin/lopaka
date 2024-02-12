import {Point} from '../../core/point';
import {DrawContext} from '../draw-context';

export enum FontFormat {
    FORMAT_5x7 = 0,
    FORMAT_BDF = 1,
    FORMAT_TTF = 2
}

export abstract class Font {
    fontReady: Promise<void>;
    protected fontLoaded: boolean = false;

    constructor(
        protected source: TFontSource,
        public name: string,
        public format: FontFormat,
        protected options?: TFontSizes
    ) {
        this.fontReady = new Promise((resolve) => {
            this.loadFont().then(() => {
                resolve();
                this.fontLoaded = true;
            });
        });
    }

    abstract loadFont(): Promise<void>;
    abstract drawText(dc: DrawContext, text: string, position: Point, scaleFactor: number): void;
    abstract getSize(dc: DrawContext, text: string, scaleFactor?: number): Point;
}
