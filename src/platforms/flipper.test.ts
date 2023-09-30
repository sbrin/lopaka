import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {FlipperPlatform} from './flipper';

describe('Flipper zero platform', () => {
    it('generating source code', () => {
        const platform = new FlipperPlatform();
        const sourceCode = platform.generateSourceCode(layersMock);
        const code = sourceCode.declarations.join('\n') + '\n' + sourceCode.code.join('\n');
        expect(code).toMatchSnapshot();
    });
});
