import {describe, expect, it} from 'vitest';
import {AdafruitPlatform} from './adafruit';
import {getLayersMock} from './layers.mock';

describe('Adafruit platform', () => {
    it('generating source code', () => {
        const platform = new AdafruitPlatform();
        expect(platform.generateSourceCode(getLayersMock())).toMatchSnapshot();
    });
});
