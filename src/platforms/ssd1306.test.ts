import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {SSD1306Platform} from './ssd1306';

describe('SSD1306 platform', () => {
    it('generating source code: arduino', () => {
        const platform = new SSD1306Platform();
        platform.setTemplate('arduino');
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
});
