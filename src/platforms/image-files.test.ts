import {setCodeSetting} from '../components/fui/code-settings';
import type {Platform} from './platform';
import type {AbstractLayer} from '../core/layers/abstract.layer';
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
import {createImageHeader, getImageAsset, getImageList, createImageFile} from './image-files';
import {MicropythonPlatform} from './micropython';
import {EsphomePlatform} from './esphome';
import {LVGLPlatform} from './lvgl';

// Exercise code and download generation independently and compare their results.
function generateCodeFiles(platform: Platform, layers: AbstractLayer[]) {
    const source = platform.generateSourceCode([...layers]);
    const settings = platform.getTemplateSettings();
    const id = (platform.constructor as typeof AdafruitPlatform).id;
    const files = settings.include_images && settings.export_images
        ? getImageList(layers, id).map((image) => createImageFile(image, id, platform))
        : [];
    return {source, files};
}

const results = new WeakMap<Platform, ReturnType<typeof generateCodeFiles>>();
function generate(platform: Platform, layers: AbstractLayer[]) {
    const result = generateCodeFiles(platform, layers);
    results.set(platform, result);
    return result.source;
}

const platforms = [
    AdafruitPlatform,
    AdafruitMonochromePlatform,
    ArduinoGFXPlatform,
    FlipperPlatform,
    GxEPD2Platform,
    TFTeSPIPlatform,
    U8g2Platform,
];

describe.each(platforms.map((PlatformClass) => ({PlatformClass, name: PlatformClass.name})))(
    '$name image header export',
    ({PlatformClass}) => {
        for (const template of Object.keys(new PlatformClass().getTemplates())) {
            it(`${template}: enabling declarations leaves header export optional`, () => {
                const platform = new PlatformClass();
                platform.setTemplate(template);
                setCodeSetting(platform.getTemplateSettings(), 'export_images', true);
                setCodeSetting(platform.getTemplateSettings(), 'include_images', false);
                expect(platform.getTemplateSettings().export_images).toBe(false);
                setCodeSetting(platform.getTemplateSettings(), 'include_images', true);
                expect(platform.getTemplateSettings().export_images).toBe(false);
                const inline = generate(platform, [...layersMock]);
                expect(results.get(platform)?.files ?? []).toEqual([]);
                setCodeSetting(platform.getTemplateSettings(), 'export_images', true);
                const external = generate(platform, [...layersMock]);
                expect((results.get(platform)?.files ?? []).length).toBeGreaterThan(0);
                expect(external).not.toBe(inline);
            });

            it(`${template}: moves the exact image declarations into headers and restores inline output`, () => {
                const platform = new PlatformClass();
                platform.setTemplate(template);
                const inline = generate(platform, [...layersMock]);
                expect(results.get(platform)?.files ?? []).toEqual([]);
                setCodeSetting(platform.getTemplateSettings(), 'export_images', true);
                const external = generate(platform, [...layersMock]);
                const headers = results.get(platform)?.files ?? [];
                expect(headers.length).toBeGreaterThan(0);
                expect(new Set(headers.map((header) => header.filename)).size).toBe(headers.length);

                let reconstructed = external;
                for (const header of headers) {
                    const declaration = (header.content as string).match(/^static const .+;$/m)?.[0];
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
                setCodeSetting(platform.getTemplateSettings(), 'export_images', false);
                expect(generate(platform, [...layersMock])).toBe(inline);
                expect(results.get(platform)?.files ?? []).toEqual([]);
            });

            it(`${template}: clears headers when declarations are disabled or images are removed`, () => {
                const platform = new PlatformClass();
                platform.setTemplate(template);
                setCodeSetting(platform.getTemplateSettings(), 'export_images', true);
                generate(platform, [...layersMock]);
                expect((results.get(platform)?.files ?? []).length).toBeGreaterThan(0);
                setCodeSetting(platform.getTemplateSettings(), 'include_images', false);
                generate(platform, [...layersMock]);
                expect(results.get(platform)?.files ?? []).toEqual([]);
                setCodeSetting(platform.getTemplateSettings(), 'include_images', true);
                generate(platform, []);
                expect(results.get(platform)?.files ?? []).toEqual([]);
            });

            it(`${template}: shares the header for identical images`, () => {
                const platform = new PlatformClass();
                platform.setTemplate(template);
                setCodeSetting(platform.getTemplateSettings(), 'export_images', true);
                const image = layersMock.find((layer) => layer instanceof AbstractImageLayer)!;
                const source = generate(platform, [image, image]);
                expect(results.get(platform)?.files ?? []).toHaveLength(1);
                const filename = (results.get(platform)?.files ?? [])[0].filename;
                expect(source.split(`#include "${filename}"`)).toHaveLength(2);
            });
        }
    }
);

it('preserves case in include guards for distinct C identifiers', () => {
    expect(createImageHeader('image_Logo_bits', '').content).not.toBe(createImageHeader('image_logo_bits', '').content);
});

it.each(
    [AdafruitPlatform, ArduinoGFXPlatform, TFTeSPIPlatform].map((PlatformClass) => ({
        PlatformClass,
        name: PlatformClass.name,
    }))
)('$name exports RGB565 data unchanged', ({PlatformClass}) => {
    const original = layersMock.find((layer) => layer instanceof AbstractImageLayer)!;
    const image = Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
        colorMode: 'rgb',
        size: new Point(2, 1),
        data: {width: 2, height: 1, data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255])},
    });
    const platform = new PlatformClass();
    const inline = generate(platform, [image]);
    setCodeSetting(platform.getTemplateSettings(), 'export_images', true);
    const external = generate(platform, [image]);
    expect(results.get(platform)?.files ?? []).toHaveLength(1);
    const header = (results.get(platform)?.files ?? [])[0];
    const declaration = (header.content as string).match(/^static const uint16_t .+;$/m)?.[0];
    expect(declaration).toBeTruthy();
    expect(declaration).toMatch(/0x[0-9A-F]{4},0x[0-9A-F]{4}/);
    expect(external.replace(`#include "${header.filename}"`, declaration!)).toBe(inline);
});

it('uses distinct filenames on case-insensitive filesystems', () => {
    const original = layersMock.find((layer) => layer instanceof AbstractImageLayer) as AbstractImageLayer;
    const first = Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
        name: 'Logo',
        colorMode: 'monochrome',
        size: new Point(1, 1),
        data: {width: 1, height: 1, data: new Uint8ClampedArray([255, 255, 255, 255])},
    });
    const second = Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
        name: 'logo',
        colorMode: 'monochrome',
        size: new Point(1, 1),
        data: {width: 1, height: 1, data: new Uint8ClampedArray([0, 0, 0, 0])},
    });
    const platform = new AdafruitPlatform();
    setCodeSetting(platform.getTemplateSettings(), 'export_images', true);
    const source = generate(platform, [first, second]);
    const headers = results.get(platform)?.files ?? [];
    expect(headers).toHaveLength(2);
    expect(new Set(headers.map((header) => header.filename.toLowerCase())).size).toBe(2);
    headers.forEach((header) => expect(source).toContain(`#include "${header.filename}"`));
});

it('exports Python modules with imports that preserve the inline bitmap declarations', () => {
    const platform = new MicropythonPlatform();
    const images = layersMock.filter((layer) => layer instanceof AbstractImageLayer);
    const inline = generateCodeFiles(platform, [...images]);
    setCodeSetting(platform.getTemplateSettings(), 'export_images', true);
    const exported = generateCodeFiles(platform, [...images]);
    expect(exported.files.length).toBeGreaterThan(0);
    let reconstructed = exported.source;
    for (const file of exported.files) {
        expect(file.filename).toMatch(/^image_\w+\.py$/);
        const declaration = (file.content as string).trimEnd();
        const symbol = declaration.split(' = ')[0];
        const importLine = `from ${file.filename.slice(0, -3)} import ${symbol}`;
        expect(exported.source).toContain(importLine);
        expect(exported.source).toContain(`framebuf.FrameBuffer(${symbol},`);
        reconstructed = reconstructed.replace(importLine, declaration);
    }
    expect(reconstructed).toBe(inline.source);
    setCodeSetting(platform.getTemplateSettings(), 'include_images', false);
    expect(generateCodeFiles(platform, [...images]).files).toEqual([]);
});

it('exports ESPHome pixel data with matching PNG paths and distinct IDs', () => {
    const platform = new EsphomePlatform();
    const original = layersMock.find((layer) => layer instanceof AbstractImageLayer)!;
    const images = [255, 0].map((value) =>
        Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
            name: 'Logo',
            imageName: 'logo',
            size: new Point(1, 1),
            data: {width: 1, height: 1, data: new Uint8ClampedArray([value, value, value, 255])},
        })
    );
    setCodeSetting(platform.getTemplateSettings(), 'export_images', true);
    const {source, files} = generateCodeFiles(platform, [...images]);
    expect(files.map((file) => file.filename)).toEqual(['img_logo.png', 'img_logo_2.png']);
    files.forEach((file, index) => {
        expect(file.content).toEqual(images[index].data);
        expect(source).toContain(`  - file: "${file.filename}"\n    id:`);
        expect(source).toContain(`file: "${file.filename}"`);
        expect(source).toContain(`id: ${file.filename.slice(0, -4)}`);
        expect(source).toContain(`id(${file.filename.slice(0, -4)})`);
    });
    expect(generateCodeFiles(platform, [images[0], images[0]]).files).toHaveLength(1);
    expect(generateCodeFiles(platform, []).files).toEqual([]);
    setCodeSetting(platform.getTemplateSettings(), 'include_images', false);
    expect(generateCodeFiles(platform, images).files).toEqual([]);
});

it('keeps only layer references in the list and reads current pixels on download', () => {
    const original = layersMock.find((layer) => layer instanceof AbstractImageLayer)!;
    const layer = Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
        size: new Point(1, 1),
        data: {width: 1, height: 1, data: new Uint8ClampedArray([255, 255, 255, 255])},
    });
    const [image] = getImageList([layer], AdafruitPlatform.id);
    expect(image.layer).toBe(layer);
    expect('content' in image || 'value' in image).toBe(false);
    const platform = new AdafruitPlatform();
    const before = createImageFile(image, AdafruitPlatform.id, platform).content;
    layer.data.data.fill(0);
    expect(createImageFile(image, AdafruitPlatform.id, platform).content).not.toBe(before);
});

it('excludes overlay images and groups identical layers under one download', () => {
    const original = layersMock.find((layer) => layer instanceof AbstractImageLayer)!;
    const duplicate = Object.assign(Object.create(Object.getPrototypeOf(original)), original);
    const overlay = Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
        modifiers: {...original.modifiers, overlay: {getValue: () => true}},
    });
    const images = getImageList([original, duplicate, overlay], 'u8g2');
    expect(images).toHaveLength(1);
    expect(images[0].layers).toEqual([original, duplicate]);
});

it('downloads LVGL images with descriptor names matching drawing code', () => {
    const original = layersMock.find((layer) => layer instanceof AbstractImageLayer)!;
    const layers = [0, 1].map((index) => Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
        name: 'logo', index,
    }));
    const platform = new LVGLPlatform();
    const source = platform.generateSourceCode([...layers]);
    const images = getImageList(layers, 'lvgl');
    expect(images.map((image) => image.filename)).toEqual(['logo.c', 'logo_1.c']);
    for (const image of images) {
        const file = createImageFile(image, 'lvgl', platform);
        expect(file.content).toContain('image_' + image.name + '_dsc');
        expect(source).toContain('image_' + image.name + '_dsc');
    }
});

it('uses matching Python module filenames when names differ only by case', () => {
    const original = layersMock.find((layer) => layer instanceof AbstractImageLayer)!;
    const layers = ['Logo', 'logo'].map((name, index) => Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
        name, index, size: new Point(1, 1),
        data: {width: 1, height: 1, data: new Uint8ClampedArray([index * 255, index * 255, index * 255, 255])},
    }));
    const platform = new MicropythonPlatform();
    platform.getTemplateSettings().export_images = true;
    const images = getImageList(layers, 'micropython');
    const source = platform.generateSourceCode(layers);
    expect(new Set(images.map((image) => image.filename.toLowerCase())).size).toBe(2);
    for (const image of images) {
        expect(source).toContain('from ' + image.filename.slice(0, -3) + ' import ' + image.name);
        expect(createImageFile(image, 'micropython', platform).content).toContain(image.name + ' = bytearray(');
    }
});

it('keeps symbols unique when a layer name already ends in a number', () => {
    const original = layersMock.find((layer) => layer instanceof AbstractImageLayer)!;
    const layers = ['logo_1', 'logo'].map((name, index) => Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
        name, index, size: new Point(1, 1),
        data: {width: 1, height: 1, data: new Uint8ClampedArray([index * 255, 0, 0, 255])},
    }));
    for (const id of ['adafruit_gfx', 'micropython', 'esphome', 'lvgl']) {
        const images = getImageList(layers, id);
        expect(new Set(images.map((image) => image.name)).size).toBe(2);
        expect(new Set(images.map((image) => image.filename)).size).toBe(2);
    }
});

it('resolves a layer to the same asset used for downloads, including aliases and colliding names', () => {
    const original = layersMock.find((layer) => layer instanceof AbstractImageLayer)!;
    const layers = [0, 255, 0].map((value, index) => Object.assign(Object.create(Object.getPrototypeOf(original)), original, {
        name: 'logo', index, size: new Point(1, 1),
        data: {width: 1, height: 1, data: new Uint8ClampedArray([value, value, value, 255])},
    }));
    const images = getImageList(layers, 'adafruit_gfx');
    expect(images).toHaveLength(2);
    expect(getImageAsset(layers[0], 'adafruit_gfx', images)).toBe(images[0]);
    expect(getImageAsset(layers[1], 'adafruit_gfx', images)).toBe(images[1]);
    expect(getImageAsset(layers[2], 'adafruit_gfx', images)).toBe(images[0]);
    expect(images[0].filename).not.toBe(images[1].filename);
});
