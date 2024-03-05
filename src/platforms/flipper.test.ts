import {describe, expect, it} from 'vitest';
import {FlipperPlatform} from './flipper';
import {getLayersMock} from './layers.mock';

describe('Flipper zero platform', () => {
    it('generating source code', () => {
        const platform = new FlipperPlatform();
        expect(platform.generateSourceCode(getLayersMock())).toMatchSnapshot();
    });
});
