import {describe, expect, it} from 'vitest';
import {AdafruitMonochromePlatform} from './adafruit_mono';
import {layersMock} from './layers.mock';

describe('Adafruit monochrome platform', () => {
    it('generating source code', () => {
        const platform = new AdafruitMonochromePlatform();
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
});
