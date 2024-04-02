import {describe, expect, it} from 'vitest';
import {InkplatePlatform} from './inkplate';
import {layersMock} from './layers.mock';

describe('Inkplate  platform', () => {
    it('generating source code', () => {
        const platform = new InkplatePlatform();
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
});
