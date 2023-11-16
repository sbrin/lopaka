import {describe, expect, it} from 'vitest';
import {AdafruitMonochromePlatform} from './adafruit_mono';
import {layersMock} from './layers.mock';

describe('Adafruit monochrome platform', () => {
    it('generating source code', () => {
        const platform = new AdafruitMonochromePlatform();
        const sourceCode = platform.generateSourceCode(layersMock);
        const code = sourceCode.declarations.join('\n') + '\n' + sourceCode.code.join('\n');
        expect(code).toMatchSnapshot();
    });
});
