import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {AdafruitPlatform} from './adafruit';

describe('Adafruit platform', () => {
    it('generating source code', () => {
        const platform = new AdafruitPlatform();
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
});
