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
    ENDFONT = 'ENDFONT',
}

/**
 * Based on https://github.com/victorporof/BDF.js
 * https://en.wikipedia.org/wiki/Glyph_Bitmap_Distribution_Format
 */
export default function parseBDF(source: string): FontPack {
    const glyphs: Map<number, FontGlyph> = new Map();
    const meta: FontMeta = {};
    const stack = [];
    let glyph: FontGlyph = null;
    let bytes: number[] = [];
    const fontLines = source.split('\n');
    for (let i = 0; i < fontLines.length; i++) {
        const line = fontLines[i];
        let data = line.split(/\s+/);
        const declaration = data[0];
        switch (declaration) {
            case BDFKeys.STARTFONT:
                stack.push(declaration);
                meta.version = data[1];
                break;
            case BDFKeys.FONT:
                meta.name = data[1];
                break;
            case BDFKeys.SIZE:
                meta.size = {
                    points: parseInt(data[1]),
                    resolutionX: parseInt(data[2]),
                    resolutionY: parseInt(data[3]),
                };
                break;
            case BDFKeys.FONTBOUNDINGBOX:
                meta.bounds = [parseInt(data[3]), parseInt(data[4]), parseInt(data[1]), parseInt(data[2])];
                break;
            case BDFKeys.STARTPROPERTIES:
                stack.push(declaration);
                meta.properties = {};
                break;
            case BDFKeys.FONT_DESCENT:
                meta.properties.fontDescent = parseInt(data[1]);
                break;
            case BDFKeys.FONT_ASCENT:
                meta.properties.fontAscent = parseInt(data[1]);
                break;
            case BDFKeys.DEFAULT_CHAR:
                meta.properties.defaultChar = parseInt(data[1]);
                break;
            case BDFKeys.ENDPROPERTIES:
                stack.pop();
                break;

            case BDFKeys.CHARS:
                meta.totalChars = parseInt(data[1]);
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
                    name: glyphName,
                };
                break;
            case BDFKeys.ENCODING:
                glyph.code = parseInt(data[1]);
                glyph.char = String.fromCharCode(parseInt(data[1]));
                break;
            case BDFKeys.SWIDTH:
                glyph.scalableSize = [parseInt(data[1]), parseInt(data[2])];
                break;
            case BDFKeys.DWIDTH:
                glyph.deviceSize = [parseInt(data[1]), parseInt(data[2])];
                glyph.xAdvance = parseInt(data[1]) + 1; // Add xAdvance for GFX compatibillity
                break;
            case BDFKeys.BBX:
                // data: [BBX, width, height, x-offset, y-offset]
                glyph.bounds = [parseInt(data[3]), parseInt(data[4]), parseInt(data[1]), parseInt(data[2])];
                glyph.bounds[1] -= meta.size.points - glyph.bounds[3]; // adjust to match GFX bounds
                break;
            case BDFKeys.BITMAP:
                const bytesPerRow = Math.ceil(glyph.bounds[2] / 8);
                for (let row = i + 1; row <= i + glyph.bounds[3]; row++) {
                    for (let j = 0; j < bytesPerRow; j++) {
                        const byte = parseInt(fontLines[row].slice(j * 2, (j + 1) * 2), 16);
                        bytes.push(byte);
                    }
                }
                break;
            case BDFKeys.ENDCHAR:
                stack.pop();
                glyph.bytes = bytes;
                glyphs.set(glyph.code, glyph);
                glyph = null;
                break;
            case BDFKeys.ENDFONT:
                stack.pop();
                break;
        }
    }
    return {glyphs, meta};
}

export function encodeBDF(font: FontPack): string {
    const lines = [];
    lines.push(`STARTFONT ${font.meta.version || '2.1'}`);
    lines.push(`FONT ${font.meta.name}`);
    lines.push(`SIZE ${font.meta.size.points} ${font.meta.size.resolutionX} ${font.meta.size.resolutionY}`);
    lines.push(
        `FONTBOUNDINGBOX ${font.meta.bounds[2]} ${font.meta.bounds[3]} ${font.meta.bounds[0]} ${font.meta.bounds[1]}`
    );
    lines.push('STARTPROPERTIES');
    lines.push(`FONT_DESCENT ${font.meta.properties.fontDescent}`);
    lines.push(`FONT_ASCENT ${font.meta.properties.fontAscent}`);
    lines.push(`DEFAULT_CHAR ${font.meta.properties.defaultChar}`);
    lines.push('ENDPROPERTIES');
    lines.push(`CHARS ${font.meta.totalChars}`);
    font.glyphs.forEach((glyph) => {
        lines.push(`STARTCHAR ${glyph.name || glyph.code}`);
        lines.push(`ENCODING ${glyph.code}`);
        lines.push(`SWIDTH ${glyph.scalableSize[0]} ${glyph.scalableSize[1]}`);
        lines.push(`DWIDTH ${glyph.deviceSize[0]} ${glyph.deviceSize[1]}`);

        const adjustedY = glyph.bounds[1] + (font.meta.size.points - glyph.bounds[3]); // adjust back to match GFX bounds
        lines.push(`BBX ${glyph.bounds[2]} ${glyph.bounds[3]} ${glyph.bounds[0]} ${adjustedY}`);

        lines.push('BITMAP');
        const bytesPerRow = Math.ceil(glyph.bounds[2] / 8);
        for (let row = 0; row < glyph.bounds[3]; row++) {
            let line = '';
            for (let j = 0; j < bytesPerRow; j++) {
                line += glyph.bytes[row * bytesPerRow + j].toString(16).padStart(2, '0');
            }
            lines.push(line.toUpperCase());
        }
        lines.push('ENDCHAR');
    });
    lines.push('ENDFONT');
    return lines.join('\n');
}
