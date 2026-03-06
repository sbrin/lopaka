import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {ArduinoGFXPlatform} from './arduinogfx';

describe('Arduino GFX platform', () => {
    it('generating source code', () => {
        const platform = new ArduinoGFXPlatform();
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
});
