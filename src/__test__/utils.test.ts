
import { describe, it, expect } from 'vitest';
import { buildLvglImageExport, flattenImageDataToBackground, imgDataToRGB565_lvgl } from '../utils';

import fs from 'fs';
import path from 'path';


describe('imgDataToRGB565_lvgl', () => {
    it('converts rgb565.png pixels to correct bytes (with rounding)', () => {
        const width = 2;
        const height = 1;
        const data = new Uint8ClampedArray([244, 67, 54, 255, 0, 150, 136, 255]);
        const imageData = {width, height, data} as ImageData;

        const expected = ['0x27', '0xfa', '0xd1', '0x04'];

        const result = imgDataToRGB565_lvgl(imageData, 0, 0, width, height, 'low', 'uint8', false);

        const normalizedResult = result.map(s => s.toLowerCase());
        const normalizedExpected = expected.map(s => s.toLowerCase());


        expect(normalizedResult).toEqual(normalizedExpected);
    });

    it('converts pixels to RGB565A8 bytes with trailing alpha', () => {
        const width = 2;
        const height = 1;
        const data = new Uint8ClampedArray([244, 67, 54, 255, 0, 150, 136, 64]);
        const imageData = {width, height, data} as ImageData;

        const expected = ['0x27', '0xFA', '0xD1', '0x04', '0xFF', '0x40'];

        const result = imgDataToRGB565_lvgl(imageData, 0, 0, width, height, 'low', 'uint8', true);

        const normalizedResult = result.map((value) => value.toLowerCase());
        const normalizedExpected = expected.map((value) => value.toLowerCase());
        expect(normalizedResult).toEqual(normalizedExpected);
    });

    it.each([
        ['white', 255, 255, 255, 255, ['0xFF', '0xFF']],
        ['black', 0, 0, 0, 255, ['0x00', '0x00']],
    ])('converts single %s pixel correctly', (_name, r, g, b, a, expected) => {
        const width = 1;
        const height = 1;
        const data = new Uint8ClampedArray([r, g, b, a]);
        const imageData = { width, height, data } as ImageData;

        const result = imgDataToRGB565_lvgl(imageData, 0, 0, width, height, 'low', 'uint8', false);

        expect(result).toEqual(expected);
    });
});

describe('flattenImageDataToBackground', () => {
    it('blends transparent and semi-transparent pixels onto the background color', () => {
        const width = 3;
        const height = 1;
        const data = new Uint8ClampedArray([10, 20, 30, 0, 255, 0, 0, 128, 1, 2, 3, 255]);
        const imageData = {width, height, data} as ImageData;

        const result = flattenImageDataToBackground(imageData, '#0000FF');

        expect(Array.from(result.data)).toEqual([0, 0, 255, 255, 128, 0, 127, 255, 1, 2, 3, 255]);
    });
});

describe('buildLvglImageExport', () => {
    it('uses background blending and RGB565 output when alpha is disabled', () => {
        const width = 1;
        const height = 1;
        const data = new Uint8ClampedArray([0, 0, 0, 0]);
        const imageData = {width, height, data} as ImageData;

        const result = buildLvglImageExport(imageData, '#FF0000', false);

        expect(result.colorFormat).toBe('LV_COLOR_FORMAT_RGB565');
        expect(result.dataSize).toBe(2);
        expect(result.bytes.map((value) => value.toLowerCase())).toEqual(['0x00', '0xf8']);
    });

    it('preserves alpha and RGB565A8 output when alpha is enabled', () => {
        const width = 1;
        const height = 1;
        const data = new Uint8ClampedArray([0, 0, 0, 0]);
        const imageData = {width, height, data} as ImageData;

        const result = buildLvglImageExport(imageData, '#FF0000', true);

        expect(result.colorFormat).toBe('LV_COLOR_FORMAT_RGB565A8');
        expect(result.dataSize).toBe(3);
        expect(result.bytes.map((value) => value.toLowerCase())).toEqual(['0x00', '0x00', '0x00']);
    });

    it('ignores background color and keeps original color when pixel is fully opaque', () => {
        const width = 1;
        const height = 1;
        const data = new Uint8ClampedArray([0, 0, 255, 255]);
        const imageData = {width, height, data} as ImageData;

        const result = buildLvglImageExport(imageData, '#00FF00', false);

        expect(result.colorFormat).toBe('LV_COLOR_FORMAT_RGB565');
        expect(result.dataSize).toBe(2);
        expect(result.bytes.map((value) => value.toLowerCase())).toEqual(['0x1f', '0x00']);
    });

    it('correctly blends semi-transparent pixel with background when alpha is disabled', () => {
        const width = 1;
        const height = 1;
        const data = new Uint8ClampedArray([255, 255, 255, 128]);
        const imageData = {width, height, data} as ImageData;

        const result = buildLvglImageExport(imageData, '#000000', false);

        expect(result.colorFormat).toBe('LV_COLOR_FORMAT_RGB565');
        expect(result.dataSize).toBe(2);
        expect(result.bytes).toBeDefined();
    });
});

