import {describe, expect, test} from 'vitest';
import {decodeBitmap, encodeBitmap} from './gfx-parser';

function printBytes(bytes) {
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
        const bits = bytes[i].toString(2);
        str += ('0'.repeat(8 - bits.length) + bits).replaceAll('1', '▪').replaceAll('0', '▫') + '\n';
    }
    return str;
}

describe('gfx-parser', () => {
    test('parseGFX', () => {
        const data = [0xf3, 0x1c, 0x53, 0x54, 0xe5, 0x48];
        const width = 3;
        const height = 5;
        for (let i = 0; i < 3; i++) {
            expect(printBytes(decodeBitmap(data.slice(i * 2, i * 2 + 2), width, height))).toMatchSnapshot();
        }
    });

    test('decode gfx bitmap', () => {
        const gfxBitmap = [0x49, 0x24, 0x92, 0x48, 0x01, 0xf8];
        const bdfBitmap = [0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x00, 0x00, 0x00, 0xe0, 0xe0];
        const width = 3;
        const height = 15;
        const decoded = decodeBitmap(gfxBitmap, width, height);
        expect(decoded).toEqual(bdfBitmap);
    });

    test('encode gfx bitmap', () => {
        const gfxBitmap = [0x49, 0x24, 0x92, 0x48, 0x01, 0xf8];
        const bdfBitmap = [0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x00, 0x00, 0x00, 0xe0, 0xe0];
        const width = 3;
        const height = 15;
        const encoded = encodeBitmap(bdfBitmap, width, height);
        expect(encoded).toEqual(gfxBitmap);
    });
});
