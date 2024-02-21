import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {U8g2Platform} from './u8g2';

describe('U8g2 platform', () => {
    it('generating source code: Arduino AVR (Cpp PROGMEM)', () => {
        const platform = new U8g2Platform();
        platform.setTemplate('Arduino AVR (Cpp PROGMEM)');
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
    it('generating source code: Arduino/Esp32 (Cpp)', () => {
        const platform = new U8g2Platform();
        platform.setTemplate('Arduino/Esp32 (Cpp)');
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
    it('generating source code: Esp-Idf (C)', () => {
        const platform = new U8g2Platform();
        platform.setTemplate('Esp-Idf (C)');
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
});
