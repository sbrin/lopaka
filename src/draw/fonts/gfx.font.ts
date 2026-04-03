import {Point} from '../../core/point';
import {DrawContext} from '../draw-context';
import parseGFX from './gfx-parser';
import {Font, FontFormat} from './font';

export class GFXFont extends Font {
    fontData: FontPack;

    constructor(
        protected source: TFontSource,
        public name: string,
        protected options: TFontSizes
    ) {
        super(source, name, FontFormat.FORMAT_GFX, options);
    }

    async loadFont(): Promise<void> {
        if (this.source instanceof File) {
            return this.source.text().then((data) => {
                this.fontData = parseGFX(data);
            });
        } else if (typeof this.source === 'string') {
            return fetch(this.source)
                .then((res) => res.text())
                .then((data) => {
                    this.fontData = parseGFX(data);
                });
        } else if (this.source instanceof Function) {
            return this.source().then((data: {default: FontPack}) => {
                this.fontData = data.default;
            });
        } else if (typeof this.source === 'object') {
            return Promise.resolve().then(() => {
                this.fontData = this.source;
            });
        }
    }

    getSize(dc: DrawContext, text: string, scaleFactor: number = 1): Point {
        const {meta, glyphs} = this.fontData;
        const size = new Point(0, 0);
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            if (glyphs.has(charCode)) {
                const glyphData = glyphs.get(charCode);
                size.x += glyphData.xAdvance;
                const h = glyphData.bounds[1] + 1;
                if (h > size.y) {
                    size.y = h;
                }
            }
        }
        return size.multiply(scaleFactor, scaleFactor);
    }

    drawText(dc: DrawContext, text: string, position: Point, scaleFactor: number = 1): void {
        const {meta, glyphs} = this.fontData;
        const charPos = position.clone();
        dc.ctx.beginPath();
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            if (glyphs.has(charCode)) {
                const glyphData = glyphs.get(charCode);
                const {bounds, bytes} = glyphData;
                const bytesPerRow = glyphData.bytes.length / bounds[3];
                for (let j = 0; j < bounds[3]; j++) {
                    for (let k = 0; k < bytesPerRow; k++) {
                        const byte = bytes[j * bytesPerRow + k];
                        for (let l = 0; l < 8; l++) {
                            if (byte & (1 << (7 - l))) {
                                dc.ctx.rect(
                                    charPos.x + (k * 8 + l + bounds[0]) * scaleFactor,
                                    charPos.y + (j - bounds[1]) * scaleFactor - scaleFactor,
                                    scaleFactor,
                                    scaleFactor
                                );
                            }
                        }
                    }
                }
                charPos.x += glyphData.xAdvance * scaleFactor;
            }
        }
        dc.ctx.fill();
    }
}
