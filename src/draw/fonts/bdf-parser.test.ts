import {expect, test} from 'vitest';
import bdfFontSource from '../fonts/bdf/profont22.bdf?raw';
import parseBDF from './bdf-parser';
test('BDFParser', () => {
    const {glyphs, meta} = parseBDF(bdfFontSource);
    expect(glyphs.size).toBe(256);
    expect(meta.size).toEqual({points: 22, resolutionX: 72, resolutionY: 72});
    expect(glyphs.get(65).bytes).toMatchSnapshot();
});
