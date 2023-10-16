import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {DrawContext} from '../draw-context';
import {Font, FontFormat} from './font';

export class BinaryFont extends Font {
    data: ArrayBuffer;
    constructor(
        protected url: string,
        public name: string,
        protected options: TFontSizes
    ) {
        super(url, name, options, FontFormat.FORMAT_5x7);
    }
    async loadFont(): Promise<void> {
        return fetch(this.url)
            .then((res) => res.arrayBuffer())
            .then((data) => {
                this.data = new Uint8Array(data);
            });
    }

    async drawText(dc: DrawContext, text: string, position: Point, scaleFactor: number = 1): Promise<Rect> {
        await this.fontReady;
        const charPos = position.clone();
        dc.ctx.beginPath();
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            const charData = this.getCharData(charCode);
            for (let col = 0; col < charData.byteLength; col++) {
                const byte = charData[col];
                for (let row = 0; row < 8; row++) {
                    if (byte & (1 << row)) {
                        dc.ctx.rect(
                            charPos.x + col * scaleFactor,
                            charPos.y + row * scaleFactor,
                            scaleFactor,
                            scaleFactor
                        );
                    }
                }
            }
            charPos.x += 6 * scaleFactor;
        }
        dc.ctx.fill();
        return new Rect(
            position,
            new Point(this.options.textCharWidth * text.length, this.options.textCharHeight).multiply(scaleFactor)
        );
    }

    getCharData(charCode: number): Uint8Array {
        return new Uint8Array(this.data.slice(charCode * 5, charCode * 5 + 5));
    }
}
