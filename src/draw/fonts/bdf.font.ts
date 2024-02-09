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
        protected url: string | File,
        public name: string,
        protected options: TFontSizes
    ) {
        super(url, name, options, FontFormat.FORMAT_BDF);
    }

    async loadFont(): Promise<void> {
        if (this.url instanceof File) {
            return this.url.text().then((data) => {
                this.parseBDF(data);
            });
        }
        return fetch(this.url)
            .then((res) => res.text())
            .then((data) => {
                this.parseBDF(data);
            });
    }

    getSize(dc: DrawContext, text: string): Point {
        const size = new Point(0, 0);
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            if (this.glyphs.has(charCode)) {
                const glyphData = this.glyphs.get(charCode);
                size.x += glyphData.deviceSize.x;
                const h = this.meta.size.points + glyphData.bounds.y;
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
                const {bytes, bounds} = glyphData;
                const bytesPerRow = glyphData.bytes.length / bounds.h;
                for (let j = 0; j < bounds.h; j++) {
                    for (let k = 0; k < bytesPerRow; k++) {
                        const byte = bytes[j * bytesPerRow + k];
                        for (let l = 0; l < 8; l++) {
                            if (byte & (1 << (7 - l))) {
                                dc.ctx.rect(charPos.x + k * 8 + l + bounds.x, charPos.y + j - bounds.y, 1, 1);
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
                    break;
                case BDFKeys.BBX:
                    glyph.bounds = new Rect(parseInt(data[3]), parseInt(data[4]), parseInt(data[1]), parseInt(data[2]));
                    break;
                case BDFKeys.BITMAP:
                    const bytesPerRow = Math.ceil(glyph.bounds.w / 8);
                    for (let row = i + 1; row <= i + glyph.bounds.h; row++) {
                        for (let j = 0; j < bytesPerRow; j++) {
                            const byte = parseInt(fontLines[row].slice(j * 2, (j + 1) * 2), 16);
                            bytes.push(byte);
                        }
                    }
                    glyph.bounds.y -= this.meta.size.points - glyph.bounds.h;
                    break;
                case BDFKeys.ENDCHAR:
                    stack.pop();
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
