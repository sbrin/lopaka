import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import { TFTeSPIPlatform } from "./tft-espi";

describe('TFT_eSPI platform', () => {
    it('generating source code', () => {
        const platform = new TFTeSPIPlatform();
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
});
