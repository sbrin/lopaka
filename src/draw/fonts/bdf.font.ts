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
    bytesPerRow?: number;
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

enum BDFKeys {
    STARTFONT = 'STARTFONT',
    FONT = 'FONT',
    SIZE = 'SIZE',
    FONTBOUNDINGBOX = 'FONTBOUNDINGBOX',
    STARTPROPERTIES = 'STARTPROPERTIES',
    FONT_DESCENT = 'FONT_DESCENT',
    FONT_ASCENT = 'FONT_ASCENT',
    DEFAULT_CHAR = 'DEFAULT_CHAR',
    ENDPROPERTIES = 'ENDPROPERTIES',
    CHARS = 'CHARS',
    STARTCHAR = 'STARTCHAR',
    ENCODING = 'ENCODING',
    SWIDTH = 'SWIDTH',
    DWIDTH = 'DWIDTH',
    BBX = 'BBX',
    BITMAP = 'BITMAP',
    ENDCHAR = 'ENDCHAR',
    ENDFONT = 'ENDFONT'
}

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
        const size = new Point();
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            if (this.glyphs.has(charCode)) {
                const glyphData = this.glyphs.get(charCode);
                size.x += glyphData.deviceSize.x;
                const h = glyphData.bounds.size.y + glyphData.bounds.pos.y;
                if (h > size.y) {
                    size.y = h;
                }
            }
        }
        return size;
    }

    drawText(dc: DrawContext, text: string, position: Point, scaleFactor: number = 1): void {
        const charPos = position.clone().subtract(0, this.meta.size.points);
        dc.ctx.beginPath();
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            if (this.glyphs.has(charCode)) {
                const glyphData = this.glyphs.get(charCode);
                const offset = new Point().subtract(0, glyphData.bounds.pos.y);
                const {bytes} = glyphData;
                for (let j = 0; j < bytes.byteLength / glyphData.bytesPerRow; j++) {
                    for (let k = 0; k < glyphData.bytesPerRow; k++) {
                        const byte = bytes[j * glyphData.bytesPerRow + k];
                        for (let l = 0; l < 8; l++) {
                            if (byte & (1 << (7 - l))) {
                                dc.ctx.rect(charPos.x + k * 8 + l, charPos.y + j + offset.y, 1, 1);
                            }
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
                case BDFKeys.STARTFONT:
                    stack.push(declaration);
                    this.meta.version = data[1];
                    break;
                case BDFKeys.FONT:
                    this.meta.name = data[1];
                    break;
                case BDFKeys.SIZE:
                    this.meta.size = {
                        points: parseInt(data[1]),
                        resolutionX: parseInt(data[2]),
                        resolutionY: parseInt(data[3])
                    };
                    break;
                case BDFKeys.FONTBOUNDINGBOX:
                    this.meta.bounds = new Rect(
                        parseInt(data[3]),
                        parseInt(data[4]),
                        parseInt(data[1]),
                        parseInt(data[2])
                    );
                    break;
                case BDFKeys.STARTPROPERTIES:
                    stack.push(declaration);
                    this.meta.properties = {};
                    break;
                case BDFKeys.FONT_DESCENT:
                    this.meta.properties.fontDescent = parseInt(data[1]);
                    break;
                case BDFKeys.FONT_ASCENT:
                    this.meta.properties.fontAscent = parseInt(data[1]);
                    break;
                case BDFKeys.DEFAULT_CHAR:
                    this.meta.properties.defaultChar = parseInt(data[1]);
                    break;
                case BDFKeys.ENDPROPERTIES:
                    stack.pop();
                    break;

                case BDFKeys.CHARS:
                    this.meta.totalChars = parseInt(data[1]);
                    break;
                case BDFKeys.STARTCHAR:
                    stack.push(declaration);
                    bytes = [];
                    let glyphName = '';
                    if (/^\d+$/.test(data[1])) {
                        // Convert Unicode sequence to a character
                        const charCode = parseInt(data[1]);
                        glyphName = String.fromCharCode(charCode);
                    } else {
                        glyphName = data[1];
                    }
                    glyph = {
                        name: glyphName
                    };
                    break;
                case BDFKeys.ENCODING:
                    glyph.code = parseInt(data[1]);
                    glyph.char = String.fromCharCode(parseInt(data[1]));
                    break;
                case BDFKeys.SWIDTH:
                    glyph.scalableSize = new Point(parseInt(data[1]), parseInt(data[2]));
                    break;
                case BDFKeys.DWIDTH:
                    glyph.deviceSize = new Point(parseInt(data[1]), parseInt(data[2]));
                    glyph.bytesPerRow = Math.ceil(parseInt(data[1]) / 8);
                    break;
                case BDFKeys.BBX:
                    glyph.bounds = new Rect(parseInt(data[3]), parseInt(data[4]), parseInt(data[1]), parseInt(data[2]));
                    break;
                case BDFKeys.BITMAP:
                    // BITMAP begins the bitmap for the current glyph.
                    // This line must be followed by one line per pixel on the Y-axis.
                    // Each line contains the hexadecimal representation of pixels in a row.
                    // A “1” bit indicates a rendered pixel. Each line is rounded to an 8 bit (one byte) boundary,
                    // padded with zeroes on the right. In this example, the glyph is exactly 8 pixels wide,
                    // and so occupies exactly 8 bits (one byte) per line so that there is no padding.
                    // The most significant bit of a line of raster data represents the leftmost pixel.
                    let row = i;
                    while (fontLines[row + 1] != BDFKeys.ENDCHAR) {
                        row++;
                        for (let j = 0; j < glyph.bytesPerRow; j++) {
                            const byte = parseInt(fontLines[row].slice(j * 2, (j + 1) * 2), 16);
                            bytes.push(byte);
                        }
                    }
                    break;
                case BDFKeys.ENDCHAR:
                    stack.pop();
                    if (bytes.length < this.meta.size.points * glyph.bytesPerRow) {
                        const padding = new Array(this.meta.size.points * glyph.bytesPerRow - bytes.length).fill(0x00);
                        bytes = [...padding, ...bytes];
                    }
                    glyph.bytes = new Uint8Array(bytes);
                    this.glyphs.set(glyph.code, glyph);
                    glyph = null;
                    break;
                case BDFKeys.ENDFONT:
                    stack.pop();
                    break;
            }
        }
    }
}
