import {toCppVariableName} from '/src/utils';

class Glyph {
    encoding: number;
    rows: number[];
    comment: string;
    offset: number;
    width: number;
    height: number;
    advance: number;
    xoffs: number;
    yoffs: number;

    constructor(comment) {
        this.encoding = -1;
        this.rows = [];
        this.comment = comment;
        this.offset = -1;
        this.width = 0;
        this.height = 0;
        this.advance = 0;
        this.xoffs = 0;
        this.yoffs = 0;
    }
}

async function bdf2gfx(inputFile: File): Promise<File> {
    const text = await inputFile.text();
    const lines = text.split('\n');

    let processing = 0;
    let getting_rows = 0;
    let chars: Glyph[] = [];
    let bitmapData = [];
    let g = null;
    let fontSize = 0;

    for (const line of lines) {
        const vals = line.split(/\s+/);
        if (vals[0] === 'SIZE') {
            fontSize = parseInt(vals[1]);
        } else if (line.includes('STARTCHAR')) {
            processing = 1;
            const vals = line.split(/\s+/);
            g = new Glyph(vals[1]);
        } else if (line.includes('ENDCHAR')) {
            let dataByteCompressed = 0;
            let dataByteCompressedIndex = 8;
            g.height = bitmapData.length;

            for (const value of bitmapData) {
                let bitIndex = 0;

                // Calculate how many bytes we need for this row's width
                const bytesNeeded = Math.ceil(g.width / 8);
                const valueBits = value.toString(2).padStart(bytesNeeded * 8, '0');

                while (bitIndex < g.width) {
                    // Get bit from the padded binary string
                    const bit = parseInt(valueBits[bitIndex]) || 0;
                    dataByteCompressed |= bit << (dataByteCompressedIndex - 1);
                    dataByteCompressedIndex -= 1;

                    if (dataByteCompressedIndex === 0) {
                        dataByteCompressedIndex = 8;
                        g.rows.push(dataByteCompressed);
                        dataByteCompressed = 0;
                    }
                    bitIndex += 1;
                }
            }

            if (dataByteCompressedIndex !== 8) {
                g.rows.push(dataByteCompressed);
            }

            if (g.encoding >= 32 && g.encoding <= 126) {
                chars.push(g);
            }
            processing = 0;
            getting_rows = 0;
            bitmapData = [];
        }

        if (processing) {
            if (line.includes('ENCODING')) {
                const vals = line.split(/\s+/);
                g.encoding = parseInt(vals[1]);
            } else if (line.includes('DWIDTH')) {
                const vals = line.split(/\s+/);
                g.advance = parseInt(vals[1]);
            } else if (line.includes('BBX')) {
                const vals = line.split(/\s+/);
                g.xoffs = 0;
                g.yoffs = -(parseInt(vals[2]) + parseInt(vals[4]));
                g.advance = parseInt(vals[1]) + 1;
                g.width = parseInt(vals[1]);
            } else if (line.includes('BITMAP')) {
                getting_rows = 1;
            } else if (getting_rows) {
                bitmapData.push(parseInt(line, 16));
            }
        }
    }

    // Generate output
    const name = toCppVariableName(inputFile.name.substring(0, inputFile.name.lastIndexOf('.')) || inputFile.name);
    let output = `const uint8_t ${name}Bitmaps[] PROGMEM = {
    `;
    let i = 0;

    for (const char of chars) {
        char.offset = i;
        let rowStr = '\t';
        let num = 3;

        for (const row of char.rows) {
            if (num !== 3) rowStr += ' ';
            rowStr += `0x${row.toString(16).padStart(2, '0')},`;
            i++;
            num--;
        }

        if (num === 1) rowStr += '\t\t';
        if (num === 2) rowStr += '\t\t\t';
        output += rowStr;
    }
    output += `}\n;`;
    output += `const GFXglyph ${name}Glyphs[] PROGMEM = {`;

    for (const char of chars) {
        output += `\t{${char.offset}, ${char.width}, ${char.height}, ${char.advance}, ${char.xoffs}, ${char.yoffs}}, // 0x${char.encoding.toString(16).padStart(2, '0')} ${char.comment}\n`;
    }

    output += `};
    `;

    const charcode_first = `0x${chars[0].encoding.toString(16).padStart(2, '0')}`;
    const charcode_last = `0x${chars[chars.length - 1].encoding.toString(16).padStart(2, '0')}`;

    output += `\nconst GFXfont ${name} PROGMEM = {
  (uint8_t  *)${name}Bitmaps,
  (GFXglyph *)${name}Glyphs,
  ${charcode_first}, ${charcode_last}, ${fontSize + Math.floor(fontSize / 10)} };`;
    return new File([output], inputFile.name.replace('.bdf', '.h'), {type: 'text/plain'});
}

export default bdf2gfx;
