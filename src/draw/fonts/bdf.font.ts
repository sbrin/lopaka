import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {DrawContext} from '../draw-context';
import parseBDF from './bdf-parser';
import {Font, FontFormat} from './font';

export class BDFFont extends Font {
    fontData: BDFFormat;

    constructor(
        protected source: TFontSource,
        public name: string,
        protected options: TFontSizes
    ) {
        super(source, name, FontFormat.FORMAT_BDF, options);
    }

    async loadFont(): Promise<void> {
        if (this.source instanceof File) {
            return this.source.text().then((data) => {
                this.fontData = parseBDF(data);
            });
        } else if (typeof this.source === 'string') {
            return fetch(this.source)
                .then((res) => res.text())
                .then((data) => {
                    this.fontData = parseBDF(data);
                });
        } else if (this.source instanceof Promise) {
            return this.source.then((data: {default: BDFFormat}) => {
                this.fontData = data.default;
            });
        } else if (typeof this.source === 'object') {
            // return this.source.then((data: BDFFormat) => {
            this.fontData = this.source;
            // });
        }
    }

    getSize(dc: DrawContext, text: string): Point {
        const {meta, glyphs} = this.fontData;
        const size = new Point(0, 0);
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            if (glyphs.has(charCode)) {
                const glyphData = glyphs.get(charCode);
                size.x += glyphData.deviceSize[0];
                const h = meta.size.points + glyphData.bounds[1];
                if (h > size.y) {
                    size.y = h;
                }
            }
        }
        return size;
    }

    drawText(dc: DrawContext, text: string, position: Point, scaleFactor: number = 1): void {
        const {meta, glyphs} = this.fontData;
        const charPos = position.clone().subtract(0, meta.size.points);
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
                                dc.ctx.rect(charPos.x + k * 8 + l + bounds[0], charPos.y + j - bounds[1], 1, 1);
                            }
                        }
                    }
                }
                charPos.x += glyphData.deviceSize[0];
            }
        }
        dc.ctx.fill();
    }
}
