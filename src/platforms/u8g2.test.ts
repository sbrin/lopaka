import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {U8g2Platform} from './u8g2';

describe('U8g2 platform', () => {
    it('generating source code', () => {
        const platform = new U8g2Platform();
        const sourceCode = platform.generateSourceCode(layersMock);
        const code = sourceCode.declarations.join('\n') + '\n' + sourceCode.code.join('\n');
        expect(code).toMatchSnapshot();
    });
});
