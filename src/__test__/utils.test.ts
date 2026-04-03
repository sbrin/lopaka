
import { describe, it, expect } from 'vitest';
import { buildLvglImageExport, flattenImageDataToBackground, imgDataToRGB565_lvgl } from '../utils';
import fs from 'fs';
import path from 'path';

// Mock Image loading for jsdom if needed
// Assuming vitest environment is jsdom

describe('imgDataToRGB565', () => {
    it('converts rgb565.png pixels to correct bytes (with rounding)', () => {
        // Pixel 1: (244, 67, 54, 255)
        // Pixel 2: (0, 135, 136, 255)
        const width = 2;
        const height = 1;
        const data = new Uint8ClampedArray([
            244, 67, 54, 255,
            0, 150, 136, 255
        ]);
        const imageData = { width, height, data } as ImageData;

        // Expected bytes provided by user: [0x27, 0xfa, 0xd1, 0x04]
        const expected = ['0x27', '0xfa', '0xd1', '0x04'];
        
        const result = imgDataToRGB565_lvgl(imageData, 0, 0, width, height, 'low', 'uint8', false);
        
        const normalizedResult = result.map(s => s.toLowerCase());
        const normalizedExpected = expected.map(s => s.toLowerCase());

        expect(normalizedResult).toEqual(normalizedExpected);
    });
});

describe('imgDataToRGB565_lvgl with alpha', () => {
    it('converts pixels to RGB565A8 bytes with trailing alpha', () => {
        // Arrange a 2x1 image with distinct alpha values.
        const width = 2;
        const height = 1;
        const data = new Uint8ClampedArray([
            244, 67, 54, 255,
            0, 150, 136, 64
        ]);
        const imageData = { width, height, data } as ImageData;

        // Expect RGB565 bytes followed by the alpha plane for RGB565A8 output.
        const expected = ['0x27', '0xFA', '0xD1', '0x04', '0xFF', '0x40'];

        // Act by converting the data to RGB565A8 output.
        const result = imgDataToRGB565_lvgl(imageData, 0, 0, width, height, 'low', 'uint8', true);

        // Assert the packed bytes match the expected sequence.
        const normalizedResult = result.map((value) => value.toLowerCase());
        const normalizedExpected = expected.map((value) => value.toLowerCase());
        expect(normalizedResult).toEqual(normalizedExpected);
    });
});

describe('flattenImageDataToBackground', () => {
    it('blends transparent and semi-transparent pixels onto the background color', () => {
        // Arrange pixel data with transparent, semi-transparent, and opaque samples.
        const width = 3;
        const height = 1;
        const data = new Uint8ClampedArray([10, 20, 30, 0, 255, 0, 0, 128, 1, 2, 3, 255]);
        const imageData = { width, height, data } as ImageData;

        // Act by flattening the image onto a blue background.
        const result = flattenImageDataToBackground(imageData, '#0000FF');

        // Assert the blended output matches expected RGB values with full alpha.
        expect(Array.from(result.data)).toEqual([0, 0, 255, 255, 128, 0, 127, 255, 1, 2, 3, 255]);
    });
});

describe('buildLvglImageExport', () => {
    it('uses background blending and RGB565 output when alpha is disabled', () => {
        // Arrange a fully transparent pixel with a red background.
        const width = 1;
        const height = 1;
        const data = new Uint8ClampedArray([0, 0, 0, 0]);
        const imageData = { width, height, data } as ImageData;

        // Act by building an export without alpha.
        const result = buildLvglImageExport(imageData, '#FF0000', false);

        // Assert that RGB565 bytes match red and the format is RGB565.
        expect(result.colorFormat).toBe('LV_COLOR_FORMAT_RGB565');
        expect(result.dataSize).toBe(2);
        expect(result.bytes.map((value) => value.toLowerCase())).toEqual(['0x00', '0xf8']);
    });

    it('preserves alpha and RGB565A8 output when alpha is enabled', () => {
        // Arrange a fully transparent pixel with black RGB values.
        const width = 1;
        const height = 1;
        const data = new Uint8ClampedArray([0, 0, 0, 0]);
        const imageData = { width, height, data } as ImageData;

        // Act by building an export with alpha.
        const result = buildLvglImageExport(imageData, '#FF0000', true);

        // Assert that RGB565A8 bytes include the alpha channel.
        expect(result.colorFormat).toBe('LV_COLOR_FORMAT_RGB565A8');
        expect(result.dataSize).toBe(3);
        expect(result.bytes.map((value) => value.toLowerCase())).toEqual(['0x00', '0x00', '0x00']);
    });
});
