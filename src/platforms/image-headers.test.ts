import {describe, expect, it} from 'vitest';
import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import {Point} from '../core/point';
import {AdafruitPlatform} from './adafruit';
import {AdafruitMonochromePlatform} from './adafruit_mono';
import {ArduinoGFXPlatform} from './arduinogfx';
import {FlipperPlatform} from './flipper';
import {GxEPD2Platform} from './gxepd2';
import {TFTeSPIPlatform} from './tft-espi';
import {U8g2Platform} from './u8g2';
import {layersMock} from './layers.mock';
import {createImageHeader} from './image-headers';

const platforms = [AdafruitPlatform, AdafruitMonochromePlatform, ArduinoGFXPlatform,
    FlipperPlatform, GxEPD2Platform, TFTeSPIPlatform, U8g2Platform];

describe.each(platforms.map((PlatformClass) => ({PlatformClass, name: PlatformClass.name})))('$name image header export', ({PlatformClass}) => {
    for (const template of Object.keys(new PlatformClass().getTemplates())) {
        it(`${template}: moves the exact image declarations into headers and restores inline output`, () => {
            const platform = new PlatformClass();
            platform.setTemplate(template);
            const inline = platform.generateSourceCode([...layersMock]);
            expect(platform.getImageHeaders()).toEqual([]);
            platform.setTemplateSetting('export_images', true);
            const external = platform.generateSourceCode([...layersMock]);
            const headers = platform.getImageHeaders();
            expect(headers.length).toBeGreaterThan(0);
            expect(new Set(headers.map((header) => header.filename)).size).toBe(headers.length);

            let reconstructed = external;
            for (const header of headers) {
                const declaration = header.content.match(/^static const .+;$/m)?.[0];
                expect(declaration).toBeTruthy();
                expect(inline).toContain(declaration);
                expect(external).not.toContain(declaration);
                expect(header.content).toContain('#include <stdint.h>');
                const symbol = header.filename.slice(0, -2);
                expect(declaration).toContain(`${symbol}[]`);
                expect(external).toContain(`#include "${header.filename}"`);
                reconstructed = reconstructed.replace(`#include "${header.filename}"`, declaration!);
            }
            // Drawing commands, identifiers, settings and ordering are unchanged.
            expect(reconstructed).toBe(inline);
            platform.setTemplateSetting('export_images', false);
            expect(platform.generateSourceCode([...layersMock])).toBe(inline);
            expect(platform.getImageHeaders()).toEqual([]);
        });

        it(`${template}: clears headers when declarations are disabled or images are removed`, () => {
            const platform = new PlatformClass();
            platform.setTemplate(template);
            platform.setTemplateSetting('export_images', true);
            platform.generateSourceCode([...layersMock]);
            expect(platform.getImageHeaders().length).toBeGreaterThan(0);
            platform.setTemplateSetting('include_images', false);
            platform.generateSourceCode([...layersMock]);
            expect(platform.getImageHeaders()).toEqual([]);
            platform.setTemplateSetting('include_images', true);
            platform.generateSourceCode([]);
            expect(platform.getImageHeaders()).toEqual([]);
        });

        it(`${template}: shares the header for identical images`, () => {
            const platform = new PlatformClass();
            platform.setTemplate(template);
            platform.setTemplateSetting('export_images', true);
            const image = layersMock.find((layer) => layer instanceof AbstractImageLayer)!;
            const source = platform.generateSourceCode([image, image]);
            expect(platform.getImageHeaders()).toHaveLength(1);
            const filename = platform.getImageHeaders()[0].filename;
            expect(source.split(`#include "${filename}"`)).toHaveLength(2);
        });
    }
});

it('preserves case in include guards for distinct C identifiers', () => {
    expect(createImageHeader('image_Logo_bits', '').content)
        .not.toBe(createImageHeader('image_logo_bits', '').content);
});

it.each([AdafruitPlatform, ArduinoGFXPlatform, TFTeSPIPlatform].map((PlatformClass) => ({PlatformClass, name: PlatformClass.name})))('$name exports RGB565 data unchanged', ({PlatformClass}) => {
    const original = layersMock.find((layer) => layer instanceof AbstractImageLayer)!;
    const image = Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
        colorMode: 'rgb', size: new Point(2, 1),
        data: {width: 2, height: 1, data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255])},
    });
    const platform = new PlatformClass();
    const inline = platform.generateSourceCode([image]);
    platform.setTemplateSetting('export_images', true);
    const external = platform.generateSourceCode([image]);
    expect(platform.getImageHeaders()).toHaveLength(1);
    const header = platform.getImageHeaders()[0];
    const declaration = header.content.match(/^static const uint16_t .+;$/m)?.[0];
    expect(declaration).toBeTruthy();
    expect(declaration).toMatch(/0x[0-9A-F]{4},0x[0-9A-F]{4}/);
    expect(external.replace(`#include "${header.filename}"`, declaration!)).toBe(inline);
});

it('uses distinct filenames on case-insensitive filesystems', () => {
    const original = layersMock.find((layer) => layer instanceof AbstractImageLayer) as AbstractImageLayer;
    const first = Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
        name: 'Logo', colorMode: 'monochrome', size: new Point(1, 1),
        data: {width: 1, height: 1, data: new Uint8ClampedArray([255, 255, 255, 255])},
    });
    const second = Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
        name: 'logo', colorMode: 'monochrome', size: new Point(1, 1),
        data: {width: 1, height: 1, data: new Uint8ClampedArray([0, 0, 0, 0])},
    });
    const platform = new AdafruitPlatform();
    platform.setTemplateSetting('export_images', true);
    const source = platform.generateSourceCode([first, second]);
    const headers = platform.getImageHeaders();
    expect(headers).toHaveLength(2);
    expect(new Set(headers.map((header) => header.filename.toLowerCase())).size).toBe(2);
    headers.forEach((header) => expect(source).toContain(`#include "${header.filename}"`));
});
