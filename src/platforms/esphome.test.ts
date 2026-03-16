import {describe, expect, it} from 'vitest';
import {layersMock} from './layers.mock';
import {EsphomePlatform} from './esphome';

describe('EsphomePlatform', () => {
    it('has id', () => {
        expect(EsphomePlatform.id).toBe('esphome');
    });

    it('generating source code', () => {
        const platform = new EsphomePlatform();
        expect(platform.generateSourceCode(layersMock)).toMatchSnapshot();
    });
});
