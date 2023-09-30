import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {AdafruitPlatform} from './adafruit';

describe('Adafruit platform', () => {
    it('generating source code', () => {
        const platform = new AdafruitPlatform();
        const sourceCode = platform.generateSourceCode(layersMock);
        const code = sourceCode.declarations.join('\n') + '\n' + sourceCode.code.join('\n');
        expect(code).toMatchSnapshot();
    });
});
