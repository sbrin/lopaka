import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {MicropythonPlatform} from './micropython';

describe('Micropython platform', () => {
    it('generating source code', () => {
        const platform = new MicropythonPlatform();
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
});
