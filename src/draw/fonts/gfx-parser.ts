const GFX_BITMAP_REGEX = /const uint8_t\s+(\w+)\[\]\s+PROGMEM\s+=\s+\{([^}]+)\}/;
const GFX_GLYPHS_REGEX = /const GFXglyph\s+(\w+)\[\]\s+PROGMEM\s+=\s+{([^;]+)};/;
const GFX_FONT_REGEX = /const GFXfont\s+(\w+)\s+PROGMEM\s+=\s+{([^}]+)}/;

function readBit(byte: number, bit: number) {
    return (byte & (1 << bit)) >> bit;
}

function writeBit(byte: number, bit: number, value: number) {
    return byte | (value << bit);
}

export default function parseGFX(source: string): FontPack {
    // clean up comments
    source = source.replace(/\/\/.*/g, '');
    // parse bitmap
    const bitmapMatch = source.match(GFX_BITMAP_REGEX);
    if (!bitmapMatch) {
        throw new Error('No bitmap data found');
    }
    const bitmap = bitmapMatch[2].split(',').map((v) => parseInt(v, 16));
    const glyphsMatch = source.match(GFX_GLYPHS_REGEX);
    const rawGlyphs = glyphsMatch[2]
        .replace(/\s+/g, '')
        .split('},')
        .filter((g) => g !== '')
        .map((g) => {
            const values = g.replace(/{/g, '').split(',');
            return values.map((value) => {
                const parsed = Number(value.replace('}', ''));
                return isNaN(parsed) ? 0 : parsed;
            });
        });
    const fontMatch = source.match(GFX_FONT_REGEX);
    let fontData = fontMatch[2].split(',').map((v) => parseInt(v.trim(), 16));
    const first = fontData[2];
    fontData = null;
    const glyphs = new Map<number, FontGlyph>();
    rawGlyphs.forEach((glyph, n) => {
        const [bitmapOffset, width, height, xAdvance, xOffset, yOffset] = glyph;
        const code = n + first;
        const bytes = decodeBitmap(
            bitmap.slice(bitmapOffset, bitmapOffset + 1 + Math.ceil(width * height) / 8),
            width,
            height
        );
        glyphs.set(code, {
            code,
            bytes,
            bounds: [xOffset, -yOffset, width, height],
            scalableSize: [width, height],
            deviceSize: [width, height],
            xAdvance,
        });
    });
    const maxWidth = Math.max(...rawGlyphs.map((g) => g[1] + g[3] + g[4]));
    const maxHeight = Math.max(...rawGlyphs.map((g) => g[2] - (g[5] + g[2])));
    const font = {
        meta: {
            name: fontMatch[1],
            size: {
                points: maxHeight,
                resolutionX: maxHeight * 10,
                resolutionY: maxHeight * 10,
            },
            bounds: [0, 0, maxWidth, maxHeight],
            properties: {
                fontDescent: 0,
                fontAscent: 0,
                defaultChar: first,
            },
            totalChars: glyphs.size,
        },
        glyphs,
    };
    return font;
}

export function decodeBitmap(gfxBytes: number[], width: number, height: number) {
    const bdfBytes = [];
    let byte = 0;
    let outBitPos = 0;
    for (let n = 0; n < width * height; n++) {
        let bytePos = Math.floor(n / 8);
        let bitPos = 7 - (n % 8);
        byte = writeBit(byte, 7 - (outBitPos % 8), readBit(gfxBytes[bytePos], bitPos));
        outBitPos++;
        if (outBitPos === width) {
            bdfBytes.push(byte);
            byte = 0;
            outBitPos = 0;
        } else if (outBitPos > 1 && outBitPos % 8 === 0) {
            bdfBytes.push(byte);
            byte = 0;
        }
    }
    return bdfBytes;
}

export function encodeBitmap(bdfBytes: number[], width: number): number[] {
    const gfxBytes: number[] = [];
    let byte = 0;
    let bitPos = 0;
    const bytesPerRow = Math.ceil(width / 8);

    for (let row = 0; row < bdfBytes.length; row += bytesPerRow) {
        for (let byteIndex = 0; byteIndex < bytesPerRow; byteIndex++) {
            const currentByte = bdfBytes[row + byteIndex] || 0; // Handle missing bytes gracefully
            for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
                const col = byteIndex * 8 + bitIndex;
                if (col >= width) break; // Avoid exceeding the glyph width

                const bdfBit = readBit(currentByte, 7 - bitIndex);
                byte = writeBit(byte, 7 - bitPos, bdfBit);
                bitPos++;

                if (bitPos === 8) {
                    gfxBytes.push(byte);
                    byte = 0;
                    bitPos = 0;
                }
            }
        }
    }

    if (bitPos > 0) {
        gfxBytes.push(byte);
    }

    return gfxBytes;
}
