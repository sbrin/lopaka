import {describe, expect, it} from 'vitest';
import {AdafruitPlatform} from './adafruit';
import {AdafruitMonochromePlatform} from './adafruit_mono';
import {ArduinoGFXPlatform} from './arduinogfx';
import {TFTeSPIPlatform} from './tft-espi';
import {U8g2Platform} from './u8g2';
import {FlipperPlatform} from './flipper';
import {MicropythonPlatform} from './micropython';
import {GxEPD2Platform} from './gxepd2';
import {InkplatePlatform} from './inkplate';
import {TextLayer} from '../core/layers/text.layer';
import {layersMock} from './layers.mock';

const platforms = [AdafruitPlatform, AdafruitMonochromePlatform, ArduinoGFXPlatform,
    TFTeSPIPlatform, U8g2Platform, FlipperPlatform, MicropythonPlatform, GxEPD2Platform, InkplatePlatform];

describe.each(platforms.map((Type) => ({Type, name: Type.name})))('$name display object', ({Type}) => {
    for (const template of Object.keys(new Type().getTemplates())) {
        it(`${template}: changes only object references and resets to the original output`, () => {
            const platform = new Type();
            platform.setTemplate(template);
            const original = platform.generateSourceCode([...layersMock]);
            expect(platform.setDisplayObjectName('myDisplay')).toBe(true);
            const custom = platform.generateSourceCode([...layersMock]);
            expect(custom).toContain('myDisplay');
            expect(custom).not.toMatch(/\b(?:display|tft|gfx|u8g2)[.>]/);
            expect(custom).not.toMatch(/[(&*]canvas\b|&u8g2\b/);
            expect(platform.setDisplayObjectName('')).toBe(true);
            expect(platform.generateSourceCode([...layersMock])).toBe(original);
        });
    }
});

it('does not rename display names inside text or layer comments', () => {
    const original = layersMock.find((layer) => layer instanceof TextLayer)!;
    const layer = Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
        text: 'display.print, tft.draw, u8g2.drawStr', name: 'display.print',
    });
    const platform = new AdafruitMonochromePlatform();
    platform.setDisplayObjectName('myDisplay');
    const source = platform.generateSourceCode([layer]);
    expect(source).toContain('myDisplay.print("display.print, tft.draw, u8g2.drawStr")');
    expect(source).toContain('// display.print');
});

it.each(['9screen', 'my display', 'display;evil()', 'class', 'for', 'True', 'a.b', 'a->b'])('rejects invalid name %s', (name) => {
    const platform = new U8g2Platform();
    platform.setDisplayObjectName('myDisplay');
    expect(platform.setDisplayObjectName(name)).toBe(false);
    expect(platform.getDisplayObjectName()).toBe('myDisplay');
});

it('stores independent names for each platform and keeps names across syntax changes', () => {
    const u8g2 = new U8g2Platform();
    const adafruit = new AdafruitMonochromePlatform();
    u8g2.setDisplayObjectName(' oled_1 ');
    u8g2.setTemplate('esp-idf');
    expect(u8g2.getDisplayObjectName()).toBe('oled_1');
    expect(adafruit.getDisplayObjectName()).toBe('display');
    expect(u8g2.generateSourceCode([])).toContain('&oled_1');
});

describe.each([AdafruitPlatform, U8g2Platform])('%s GNU keyword validation', (PlatformClass) => {
    it.each([
        'typeof', 'typeof_unqual', '__typeof', '__typeof__', '__typeof_unqual', '__typeof_unqual__',
        '__asm', '__asm__', '__inline', '__inline__', '__alignof', '__alignof__',
        '__attribute', '__attribute__', '__auto_type', '__extension__', '__thread', '__label__',
        '__const', '__const__', '__volatile', '__volatile__', '__signed', '__signed__',
        '__restrict', '__restrict__', '__complex', '__complex__', '__real', '__real__', '__imag', '__imag__',
    ])('rejects %s without changing the last valid name', (name) => {
        const platform = new PlatformClass();
        platform.setDisplayObjectName('myDisplay');
        expect(platform.setDisplayObjectName(name)).toBe(false);
        expect(platform.getDisplayObjectName()).toBe('myDisplay');
    });

    it.each(['typeofDisplay', 'my_typeof', '_screen', 'oled_1'])('accepts ordinary identifier %s', (name) => {
        const platform = new PlatformClass();
        expect(platform.setDisplayObjectName(name)).toBe(true);
        expect(platform.getDisplayObjectName()).toBe(name);
    });
});
