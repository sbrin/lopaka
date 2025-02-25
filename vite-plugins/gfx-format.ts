import {Plugin} from 'vite';
import parseGFX from '../src/draw/fonts/gfx-parser';

const gfxExt = /\.h$/;

const gfxFormatkPlugin: Plugin = {
    name: '.h',
    transform(code, id) {
        if (gfxExt.test(id)) {
            const fontData: any = parseGFX(code);
            fontData.glyphs = Array.from(fontData.glyphs.entries() as [string, any]).map(([key, value]) => [
                value.code,
                value.char,
                value.scalableSize,
                value.deviceSize,
                value.bounds,
                value.bytes,
                value.xAdvance,
            ]);

            return {
                code: `
/*
    @file: ${id.split('/').pop()}
    @name: ${fontData.meta.name}
    @glyphs: ${fontData.meta.totalChars}
*/
const fontData = ${JSON.stringify(fontData)};
fontData.glyphs = new Map(fontData.glyphs.map(([code, char, scalableSize, deviceSize, bounds, bytes, xAdvance]) => ([code, {code,char,scalableSize,deviceSize,bounds,bytes: bytes, xAdvance}])));
export default fontData;`,
                map: null,
            };
        }
    },
};
export default gfxFormatkPlugin;
