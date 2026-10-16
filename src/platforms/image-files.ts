import {AbstractImageLayer} from '../core/layers/abstract-image.layer';
import type {AbstractLayer} from '../core/layers/abstract.layer';
import type {Platform} from './platform';
import {
    buildLvglImageExport,
    flattenImageDataToBackground,
    imgDataToBuffer,
    imgDataToRGB565,
    imgDataToXBMP,
    toCppVariableName,
} from '../utils';
import imageTemplate from './templates/lvgl/image.pug';

export type ImageFile = {filename: string; content: string | ImageData};
export type ImageAsset = {
    name: string;
    filename: string;
    type: 'bitmap' | 'bitmap565';
    layer: AbstractImageLayer;
    layers: AbstractImageLayer[];
};

// Only names and references to layers. File contents are prepared when downloaded.
export function getImageList(layers: AbstractLayer[], platformId: string): ImageAsset[] {
    const images: ImageAsset[] = [];
    const extension = {lvgl: 'c', micropython: 'py', esphome: 'png'}[platformId] ?? 'h';
    for (const layer of [...layers].sort((a, b) => a.index - b.index)) {
        if (!(layer instanceof AbstractImageLayer) || layer.modifiers.overlay?.getValue()) continue;
        const type =
            layer.colorMode === 'rgb' && ['adafruit_gfx', 'arduino_gfx', 'tft-espi'].includes(platformId)
                ? 'bitmap565'
                : 'bitmap';
        const duplicate =
            platformId !== 'lvgl' &&
            images.find(
                (image) =>
                    image.type === type &&
                    image.layer.size.x === layer.size.x &&
                    image.layer.size.y === layer.size.y &&
                    image.layer.alphaChannel === layer.alphaChannel &&
                    image.layer.data.data.length === layer.data.data.length &&
                    image.layer.data.data.every((value, index) => value === layer.data.data[index])
            );
        if (duplicate) {
            duplicate.layers.push(layer);
            continue;
        }
        const base =
            toCppVariableName(platformId === 'esphome' ? (layer.imageName ?? layer.name) : layer.name) || 'paint';
        const count = images.filter(
            (image) => image.type === type && image.name.startsWith(platformId === 'lvgl' ? base : `image_${base}`)
        ).length;
        const suffix = count || base === 'paint' || platformId === 'flipper' ? `_${count}` : '';
        let name = `image_${base}${suffix}_${type === 'bitmap565' ? 'pixels' : 'bits'}`;
        if (platformId === 'esphome') name = `img_${base}`;
        if (platformId === 'lvgl') name = base + suffix;
        let filename = `${name}.${extension}`;
        let number = 2;
        while (images.some((image) => image.filename.toLowerCase() === filename.toLowerCase())) {
            filename = `${name}_${number++}.${extension}`;
        }
        // Keep the symbol and filename consistent, including name collisions.
        name = filename.slice(0, -(extension.length + 1));
        images.push({name, filename, type, layer, layers: [layer]});
    }
    return images;
}

export function getImageData(image: ImageAsset, platformId: string, background: string): string {
    const {layer} = image;
    if (platformId === 'micropython') return imgDataToBuffer(layer.data, 0, 0, layer.size.x, layer.size.y);
    if (image.type === 'bitmap565') {
        const data =
            platformId === 'tft-espi' && layer.alphaChannel === false
                ? flattenImageDataToBackground(layer.data, background)
                : layer.data;
        return imgDataToRGB565(
            data,
            0,
            0,
            layer.size.x,
            layer.size.y,
            platformId === 'arduino_gfx' ? 'high' : 'low'
        ).join(',');
    }
    return imgDataToXBMP(layer.data, 0, 0, layer.size.x, layer.size.y, !['u8g2', 'flipper'].includes(platformId)).join(
        ','
    );
}

export function createImageFile(image: ImageAsset, platformId: string, platform: Platform): ImageFile {
    const {layer, name, filename} = image;
    if (platformId === 'esphome') return {filename, content: layer.data};
    if (platformId === 'lvgl') {
        const data = buildLvglImageExport(
            layer.data,
            platform.features.screenBgColor,
            layer.colorMode === 'rgb' && layer.alphaChannel
        );
        return {
            filename,
            content: imageTemplate({
                imageName: name,
                imageData565: data.bytes.join(', '),
                imageWidth: layer.data.width,
                imageHeight: layer.data.height,
                imageDataSize: data.dataSize,
                imageColorFormat: data.colorFormat,
            }),
        };
    }
    const value = getImageData(image, platformId, platform.features.screenBgColor);
    if (platformId === 'micropython') return {filename, content: `${name} = bytearray(${value})\n`};
    let declaration: string;
    if (platformId === 'flipper' || (platformId === 'u8g2' && platform.getTemplate() === 'esp-idf')) {
        declaration = `static const uint8_t ${name}[] = {${value}};`;
    } else if (platformId === 'u8g2') {
        declaration = `static const unsigned char ${name}[]${platform.getTemplateSettings().progmem ? ' U8X8_PROGMEM' : ''} = {${value}};`;
    } else {
        declaration = `static const ${image.type === 'bitmap565' ? 'uint16_t' : 'unsigned char'} PROGMEM ${name}[] = {${value}};`;
    }
    return {...createImageHeader(name, declaration), filename};
}

export function createImageHeader(name: string, declaration: string) {
    const guard = `LOPAKA_${name}_H`;
    return {
        filename: `${name}.h`,
        content: `#ifndef ${guard}\n#define ${guard}\n\n#include <stdint.h>\n\n${declaration}\n\n#endif // ${guard}\n`,
    };
}
