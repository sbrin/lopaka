import {Point} from '../../core/point';
import {DrawContext} from '../draw-context';
import {Font, FontFormat} from './font';
/**
 * @deprecated use BDFFont instead
 */
export class BinaryFont extends Font {
    data: ArrayBuffer;
    constructor(
        protected source: TFontSource,
        public name: string,
        protected options?: TFontSizes
    ) {
        super(source, name, FontFormat.FORMAT_5x7, options);
    }
    async loadFont(): Promise<void> {
        if (this.source instanceof File) {
            return this.source.arrayBuffer().then((data) => {
                this.data = new Uint8Array(data);
            });
        }
        return fetch(this.source)
            .then((res) => res.arrayBuffer())
            .then((data) => {
                this.data = new Uint8Array(data);
            });
    }

    getSize(dc: DrawContext, text: string, scaleFactor: number = 1): Point {
        return new Point((this.options.textCharWidth + 1) * text.length, this.options.size)
            .subtract(1)
            .multiply(scaleFactor);
    }

    drawText(dc: DrawContext, text: string, position: Point, scaleFactor: number = 1): void {
        const charPos = position.clone().subtract(0, this.options.size - 1);
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
    }

    getCharData(charCode: number): Uint8Array {
        return new Uint8Array(this.data.slice(charCode * 5, charCode * 5 + 5));
    }
}
