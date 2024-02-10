import {Plugin} from 'vite';
import parseBDF from '../src/draw/fonts/bdf-parser';

const bdfExt = /\.bdf$/;

const bdfFormatkPlugin: Plugin = {
    name: '.bdf',
    transform(code, id) {
        if (bdfExt.test(id)) {
            const fontData: any = parseBDF(code);
            fontData.glyphs = Array.from(fontData.glyphs.entries());
            return {
                code: `
/*
    @file: ${id}
*/
const fontData = ${JSON.stringify(fontData)};
fontData.glyphs = new Map(fontData.glyphs);
export default fontData;`,
                map: null
            };
        }
    }
};
export default bdfFormatkPlugin;
