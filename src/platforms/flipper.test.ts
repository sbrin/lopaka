import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {FlipperPlatform} from './flipper';

describe('Flipper zero platform', () => {
    it('generating source code', () => {
        const platform = new FlipperPlatform();
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
});
