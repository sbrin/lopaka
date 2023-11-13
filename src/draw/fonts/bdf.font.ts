import {Point} from '../../core/point';
import {Rect} from '../../core/rect';
import {DrawContext} from '../draw-context';
import {Font, FontFormat} from './font';

type BDFGlyph = {
    code?: number;
    char?: string;
    name?: string;
    bytes?: Uint8Array;
    bounds?: Rect;
    scalableSize?: Point;
    deviceSize?: Point;
    bitmap?: number[][];
};

type BDFMeta = {
    version?: string;
    name?: string;
    size?: {
        points: number;
        resolutionX: number;
        resolutionY: number;
    };
    bounds?: Rect;
    properties?: {
        fontDescent?: number;
        fontAscent?: number;
        defaultChar?: number;
    };
    totalChars?: number;
};

export class BDFFont extends Font {
    meta: BDFMeta;
    glyphs: Map<number, BDFGlyph> = new Map();

    constructor(
        protected url: string,
        public name: string,
        protected options: TFontSizes
    ) {
        super(url, name, options, FontFormat.FORMAT_BDF);
    }

    async loadFont(): Promise<void> {
        return fetch(this.url)
            .then((res) => res.text())
            .then((data) => {
                this.parseBDF(data);
            });
    }

    getSize(dc: DrawContext, text: string): Point {
        return this.meta.bounds.size.clone().multiply(text.length, 1).subtract(1, 0);
    }

    drawText(dc: DrawContext, text: string, position: Point, scaleFactor: number = 1): void {
        const {bounds} = this.meta;
        const charPos = position.clone().subtract(1, 0);
        dc.ctx.beginPath();
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            if (this.glyphs.has(charCode)) {
                const glyphData = this.glyphs.get(charCode);
                const {bytes} = glyphData;
                for (let j = 0; j < bytes.byteLength; j++) {
                    const byte = bytes[j];
                    for (let i = 0; i < 8; i++) {
                        if (byte & (1 << (8 - i))) {
                            dc.ctx.rect(i + charPos.x, j + charPos.y - bounds.y, 1, 1);
                        }
                    }
                }
                charPos.x += glyphData.deviceSize.x;
            }
        }
        dc.ctx.fill();
    }

    getCharData(charCode: number): Uint8Array {
        const glyph = this.glyphs.get(charCode);
        return glyph.bytes;
    }

    /**
     * Based on https://github.com/victorporof/BDF.js
     * https://en.wikipedia.org/wiki/Glyph_Bitmap_Distribution_Format
     */
    parseBDF(source: string): void {
        this.glyphs.clear();
        this.meta = {};
        let glyph: BDFGlyph = null;
        const stack = [];
        let bytes: number[] = [];
        const fontLines = source.split('\n');
        for (let i = 0; i < fontLines.length; i++) {
            const line = fontLines[i];
            let data = line.split(/\s+/);
            const declaration = data[0];
            switch (declaration) {
                case 'STARTFONT':
                    stack.push(declaration);
                    this.meta.version = data[1];
                    break;
                case 'FONT':
                    this.meta.name = data[1];
                    break;
                case 'SIZE':
                    this.meta.size = {
                        points: parseInt(data[1]),
                        resolutionX: parseInt(data[2]),
                        resolutionY: parseInt(data[3])
                    };
                    break;
                case 'FONTBOUNDINGBOX':
                    this.meta.bounds = new Rect(
                        parseInt(data[3]),
                        parseInt(data[4]),
                        parseInt(data[1]),
                        parseInt(data[2])
                    );
                    break;
                case 'STARTPROPERTIES':
                    stack.push(declaration);
                    this.meta.properties = {};
                    break;
                case 'FONT_DESCENT':
                    this.meta.properties.fontDescent = parseInt(data[1]);
                    break;
                case 'FONT_ASCENT':
                    this.meta.properties.fontAscent = parseInt(data[1]);
                    break;
                case 'DEFAULT_CHAR':
                    this.meta.properties.defaultChar = parseInt(data[1]);
                    break;
                case 'ENDPROPERTIES':
                    stack.pop();
                    break;

                case 'CHARS':
                    this.meta.totalChars = parseInt(data[1]);
                    break;
                case 'STARTCHAR':
                    stack.push(declaration);
                    bytes = [];
                    glyph = {
                        name: data[1],
                        bitmap: []
                    };
                    break;
                case 'ENCODING':
                    glyph.code = parseInt(data[1]);
                    glyph.char = String.fromCharCode(parseInt(data[1]));
                    break;
                case 'SWIDTH':
                    glyph.scalableSize = new Point(parseInt(data[1]), parseInt(data[2]));
                    break;
                case 'DWIDTH':
                    glyph.deviceSize = new Point(parseInt(data[1]), parseInt(data[2]));
                    break;
                case 'BBX':
                    glyph.bounds = new Rect(parseInt(data[3]), parseInt(data[4]), parseInt(data[1]), parseInt(data[2]));
                    break;
                case 'BITMAP':
                    // BITMAP begins the bitmap for the current glyph.
                    // This line must be followed by one line per pixel on the Y-axis.
                    // Each line contains the hexadecimal representation of pixels in a row.
                    // A “1” bit indicates a rendered pixel. Each line is rounded to an 8 bit (one byte) boundary,
                    // padded with zeroes on the right. In this example, the glyph is exactly 8 pixels wide,
                    // and so occupies exactly 8 bits (one byte) per line so that there is no padding.
                    // The most significant bit of a line of raster data represents the leftmost pixel.
                    for (let row = 0; row < this.meta.size.points; row++, i++) {
                        const byte = parseInt(fontLines[i + 1], 16);
                        bytes.push(byte);
                    }
                    break;
                case 'ENDCHAR':
                    stack.pop();
                    glyph.bytes = new Uint8Array(bytes);
                    this.glyphs.set(glyph.code, glyph);
                    glyph = null;
                    break;
                case 'ENDFONT':
                    stack.pop();
                    break;
            }
        }
    }
}
