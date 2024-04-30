import {describe, expect, it} from 'vitest';
import {getLayersMock} from './layers.mock';
import {Uint32RawPlatform} from './uint32-raw';

describe('Flipper zero platform', () => {
    it('generating source code', () => {
        const platform = new Uint32RawPlatform();
        expect(
            platform.generateSourceCode(getLayersMock(), new OffscreenCanvas(128, 64).getContext('2d'))
        ).toMatchSnapshot();
    });
});
