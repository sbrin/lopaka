import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {TFTeSPIPlatform} from './tft-espi';
import {unpackedHexColor565} from '../utils';
import {PolygonLayer} from '../core/layers/polygon.layer';

describe('TFT_eSPI platform', () => {
    it('generating source code', () => {
        const platform = new TFTeSPIPlatform();
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
    it('imports source code with setFreeFont default', () => {
        // Arrange a sample that previously crashed when setFreeFont had no args.
        const platform = new TFTeSPIPlatform();
        const source = `
const char* time_of_day_text = "12:23 PM";

tft.setTextColor(0xE33F);
    tft.setTextSize(1);
    tft.setFreeFont();
    tft.drawString(time_of_day_text, 63, 6);
`;
        // Act by parsing the source into layer states.
        const {states, warnings} = platform.importSourceCode(source);
        // Assert parsed layer data uses the default font and expected values.
        expect(warnings).toEqual([]);
        expect(states).toHaveLength(1);
        expect(states[0].type).toBe('string');
        expect(states[0].text).toBe('time_of_day_text');
        expect(states[0].font).toBe('adafruit');
        expect(states[0].scaleFactor).toBe(1);
        expect(states[0].color).toBe(unpackedHexColor565('0xE33F'));
        expect(states[0].position.x).toBe(63);
        expect(states[0].position.y).toBe(13);
    });
    it('normalizes polygon helper names to valid C and C++ identifiers', () => {
        const platform = new TFTeSPIPlatform();
        const polygon = layersMock.find((layer) => layer instanceof PolygonLayer) as PolygonLayer;
        const originalName = polygon.name;
        polygon.name = 'Polygon 01-test';

        const source = platform.generateSourceCode([polygon]);
        polygon.name = originalName;

        expect(source).toContain('void draw_Polygon_01_test(void)');
        expect(source).toContain('draw_Polygon_01_test();');
    });
});
