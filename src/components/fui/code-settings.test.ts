import {describe, expect, it} from 'vitest';
import {FreestylePlatform} from '../../platforms/freestyle';
import {Uint32RawPlatform} from '../../platforms/uint32-raw';
import {applySavedCodeSettings, generateCodeFiles} from './code-settings';

describe('code settings', () => {
    it('keeps platform defaults when there are no saved choices', () => {
        const settings = {wrap: true, include_fonts: true};

        applySavedCodeSettings(settings, {});

        expect(settings).toEqual({wrap: true, include_fonts: true});
    });

    it('applies explicit saved choices only for settings supported by the platform', () => {
        const settings = {wrap: true, include_fonts: true};

        applySavedCodeSettings(settings, {wrap: false, unsupported: false});

        expect(settings).toEqual({wrap: false, include_fonts: true});
    });
});

it('generates code for platforms without template settings', () => {
    expect(generateCodeFiles(new FreestylePlatform(), [])).toEqual({source: '', files: []});
    const ctx = {
        canvas: {width: 1, height: 1},
        getImageData: () => ({width: 1, height: 1, data: new Uint8ClampedArray([255, 255, 255, 255])}),
    } as unknown as OffscreenCanvasRenderingContext2D;
    const platform = new Uint32RawPlatform();
    expect(generateCodeFiles(platform, [], ctx)).toEqual({source: platform.generateSourceCode([], ctx), files: []});
});
