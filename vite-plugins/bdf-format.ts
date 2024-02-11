import {Plugin} from 'vite';
import parseBDF from '../src/draw/fonts/bdf-parser';

const bdfExt = /\.bdf$/;

const bdfFormatkPlugin: Plugin = {
    name: '.bdf',
    transform(code, id) {
        if (bdfExt.test(id)) {
            const fontData: any = parseBDF(code);
            fontData.glyphs = Array.from(fontData.glyphs.entries() as [string, any]).map(([key, value]) => [
                value.code,
                value.char,
                value.scalableSize,
                value.deviceSize,
                value.bounds,
                value.bytes
            ]);

            return {
                code: `
/*
    @file: ${id.split('/').pop()}
    @name: ${fontData.meta.name}
    @glyphs: ${fontData.meta.totalChars}
*/
const fontData = ${JSON.stringify(fontData)};
fontData.glyphs = new Map(fontData.glyphs.map(([code, char, scalableSize, deviceSize, bounds, bytes]) => ([code, {code,char,scalableSize,deviceSize,bounds,bytes: new Uint8Array(bytes)}])));
export default fontData;`,
                map: null
            };
        }
    }
};
export default bdfFormatkPlugin;
