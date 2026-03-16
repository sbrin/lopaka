import {decode, encode} from 'base64-arraybuffer';
import pako from 'pako';
import {Rect} from './core/rect';
import {UnwrapRef} from 'vue';

type RGBColor = {
    r: number;
    g: number;
    b: number;
    a?: number;
};

function bitswap(b) {
    b = ((b & 0xf0) >> 4) | ((b & 0x0f) << 4);
    b = ((b & 0xcc) >> 2) | ((b & 0x33) << 2);
    b = ((b & 0xaa) >> 1) | ((b & 0x55) << 1);
    return b;
}

export async function readTextFileAsync(file): Promise<string> {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result.toString());
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

export async function readFileAsync(file): Promise<string> {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export async function loadImageAsync(src): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        img.onerror = reject;
        img.onload = () => resolve(img);
    });
}

export async function loadImageDataAsync(src): Promise<ImageData> {
    const img = await loadImageAsync(src);
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
}

export async function extractGifFrames(file: File): Promise<HTMLImageElement[]> {
    return new Promise(async (resolve, reject) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Check if it's a GIF file
            if (uint8Array[0] !== 0x47 || uint8Array[1] !== 0x49 || uint8Array[2] !== 0x46) {
                reject(new Error('Not a valid GIF file'));
                return;
            }

            // Dynamic import of gifuct-js to avoid bundling issues
            const {decompressFrames, parseGIF} = await import('gifuct-js');

            // Parse the GIF
            const gif = parseGIF(uint8Array.buffer);
            const frames = decompressFrames(gif, true);

            if (frames.length === 0) {
                reject(new Error('No frames found in GIF'));
                return;
            }

            const imageFrames: HTMLImageElement[] = [];

            // Process each frame
            for (let i = 0; i < frames.length; i++) {
                const frame = frames[i];

                // Create ImageData from frame data
                const imageData = new ImageData(
                    new Uint8ClampedArray(frame.patch),
                    frame.dims.width,
                    frame.dims.height
                );

                // Convert ImageData to HTMLImageElement using existing utility
                const img = await imageDataToImage(imageData);
                imageFrames.push(img);
            }

            resolve(imageFrames);
        } catch (error) {
            // Fallback: try to load as a regular image (for static GIFs or parsing errors)
            try {
                const img = await loadImageAsync(URL.createObjectURL(file));
                resolve([img]);
            } catch (fallbackError) {
                reject(new Error(`GIF processing failed: ${error.message}`));
            }
        }
    });
}

export function hexToRgb(hexColor: string): RGBColor {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return {r, g, b};
}

export function rgbToHex(rgbColor: number[]) {
    return `#${rgbColor.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function packedHexColor565(color: string) {
    const c = packColor565(color);
    return `0x${c.toString(16).toUpperCase()}`;
}

export function unpackedHexColor565(color: string) {
    const c = parseInt(color, 16);
    const r = ((c >> 11) & 0x1f) << 3;
    const g = ((c >> 5) & 0x3f) << 2;
    const b = (c & 0x1f) << 3;
    return rgbToHex([r, g, b]);
}

export function packColor565(hexColor: string) {
    const rgb = hexToRgb(hexColor);
    return ((rgb.r >> 3) << 11) | ((rgb.g >> 2) << 5) | (rgb.b >> 3);
}

export function hexWeb2C(hexColor: string) {
    return hexColor.replace('#', '0x');
}

export function addAlphaChannelToImageData(data: ImageData, color: string) {
    const newData = new Uint8ClampedArray(data.width * data.height * 4);
    const rgb = hexToRgb(color);
    // const colors = new Map<string, number>();
    let hasAlphaChannel = false;
    for (let i = 0; i < data.data.length; i += 4) {
        if (data.data[i + 3] == 0) {
            hasAlphaChannel = true;
            break;
        }
    }
    if (hasAlphaChannel) {
        for (let i = 0; i < data.data.length; i += 4) {
            if (data.data[i + 3] != 0) {
                newData[i] = rgb.r;
                newData[i + 1] = rgb.g;
                newData[i + 2] = rgb.b;
                newData[i + 3] = 255;
            } else {
                newData[i] = 0;
                newData[i + 1] = 0;
                newData[i + 2] = 0;
                newData[i + 3] = 0;
            }
        }
    } else {
        // alpha channnel color is white by default, else just invert
        const alphaColor = {r: 255, g: 255, b: 255};
        for (let i = 0; i < data.data.length; i += 4) {
            // if color is closest to alphaColor or alpha is more than 50%
            if (
                data.data[i + 3] > 175 &&
                !isAlphaColor(alphaColor, [data.data[i], data.data[i + 1], data.data[i + 2]])
            ) {
                newData[i] = rgb.r;
                newData[i + 1] = rgb.g;
                newData[i + 2] = rgb.b;
                newData[i + 3] = 255;
            } else {
                newData[i] = 0;
                newData[i + 1] = 0;
                newData[i + 2] = 0;
                newData[i + 3] = 0;
            }
        }
    }
    return new ImageData(newData, data.width, data.height);
}

function isAlphaColor(alpha: RGBColor, color: number[]) {
    return Math.abs(alpha.r - color[0]) < 15 && Math.abs(alpha.g - color[1]) < 15 && Math.abs(alpha.b - color[2]) < 15;
}

export function imageToImageData(img: HTMLImageElement): ImageData {
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
}

export async function imageDataToImage(imgData: ImageData): Promise<HTMLImageElement> {
    const canvas = document.createElement('canvas');
    canvas.width = imgData.width;
    canvas.height = imgData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imgData, 0, 0);
    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    await new Promise((resolve) => {
        img.onload = resolve;
    });
    return img;
}

export function imageDataToFile(imgData: ImageData, fileName: string = 'image.png'): File {
    const uint8Array = new Uint8Array(imgData.data.buffer);
    const blob = new Blob([uint8Array], {type: 'image/png'});
    return new File([blob], fileName, {type: 'image/png'});
}

export function flattenImageDataToBackground(image: ImageData, backgroundHex: string): ImageData {
    // Return early when image data is missing.
    if (!image) {
        return image;
    }
    // Normalize the background color to a safe hex value.
    const safeBackground = backgroundHex && backgroundHex.startsWith('#') ? backgroundHex : '#000000';
    const background = hexToRgb(safeBackground);
    // Blend each pixel onto the background using its alpha channel.
    const blended = new Uint8ClampedArray(image.data.length);
    for (let i = 0; i < image.data.length; i += 4) {
        const alpha = image.data[i + 3] / 255;
        const inverseAlpha = 1 - alpha;
        blended[i] = Math.round(image.data[i] * alpha + background.r * inverseAlpha);
        blended[i + 1] = Math.round(image.data[i + 1] * alpha + background.g * inverseAlpha);
        blended[i + 2] = Math.round(image.data[i + 2] * alpha + background.b * inverseAlpha);
        blended[i + 3] = 255;
    }
    // Create a new ImageData instance and copy blended pixels into it.
    const output = new ImageData(image.width, image.height);
    // Fall back to a plain object when the test polyfill creates a zero-length buffer.
    if (output.data.length !== blended.length) {
        return {data: blended, width: image.width, height: image.height} as ImageData;
    }
    output.data.set(blended);
    return output;
}

export function imgDataToXBMP(
    imgData: ImageData,
    xStart: number,
    yStart: number,
    width: number,
    height: number,
    swapBits: boolean = false
): string[] {
    if (!imgData) {
        return [];
    }
    const bytesPerRow = Math.ceil(width / 8);
    const xbmp = new Array(height * bytesPerRow).fill(0);
    for (let y = yStart; y < yStart + height; y++) {
        for (let x = xStart; x < xStart + width; x++) {
            const imgDataIndex = (y * width + x) * 4;
            const rgbSumValue =
                imgData.data[imgDataIndex] + imgData.data[imgDataIndex + 1] + imgData.data[imgDataIndex + 2];
            const alphaValue = imgData.data[imgDataIndex + 3];
            // b&w + alpha masking
            if (alphaValue > 127 /*&& rgbSumValue < 381*/) {
                const xbmpIndex = (y - yStart) * bytesPerRow + Math.floor((x - xStart) / 8);
                const bitPosition = (x - xStart) % 8;
                xbmp[xbmpIndex] |= 1 << bitPosition;
            }
        }
    }

    for (let i = 0; i < xbmp.length; i++) {
        xbmp[i] = swapBits ? bitswap(xbmp[i]) : xbmp[i];
        xbmp[i] = '0x' + xbmp[i].toString(16).padStart(2, '0');
    }

    return xbmp;
}

export function imgDataToRGB565(
    imgData: ImageData,
    xStart: number,
    yStart: number,
    width: number,
    height: number,
    byteOrder: 'high' | 'low' = 'low'
): string[] {
    if (!imgData) {
        return [];
    }

    const rgb565: string[] = [];
    const canvasWidth = imgData.width;

    for (let y = yStart; y < yStart + height; y++) {
        for (let x = xStart; x < xStart + width; x++) {
            const index = (y * canvasWidth + x) * 4;
            const alpha = imgData.data[index + 3];

            if (alpha < 128) {
                rgb565.push('0x0000');
                continue;
            }

            const r = imgData.data[index];
            const g = imgData.data[index + 1];
            const b = imgData.data[index + 2];

            let packed = ((r & 0b11111000) << 8) | ((g & 0b11111100) << 3) | (b >> 3);

            if (byteOrder === 'low') {
                packed = ((packed & 0xff) << 8) | (packed >> 8);
            }

            rgb565.push(`0x${packed.toString(16).padStart(4, '0').toUpperCase()}`);
        }
    }

    return rgb565;
}

export function imgDataToRGB565_lvgl(
    imgData: ImageData,
    xStart: number,
    yStart: number,
    width: number,
    height: number,
    byteOrder: 'high' | 'low' = 'low',
    outputFormat: 'uint16' | 'uint8' = 'uint16',
    includeAlpha: boolean = true
): string[] {
    // Return an empty array when there is no image data.
    if (!imgData) {
        return [];
    }

    // Prepare output buffers for color data (and alpha if requested).
    const rgb565: string[] = [];
    const alphaBytes: string[] = [];
    const canvasWidth = imgData.width;

    // Walk the requested rectangle and pack each pixel.
    for (let y = yStart; y < yStart + height; y++) {
        for (let x = xStart; x < xStart + width; x++) {
            const index = (y * canvasWidth + x) * 4;
            const alpha = imgData.data[index + 3];

            // Handle transparent pixels when alpha output is disabled.
            if (!includeAlpha && alpha < 128) {
                if (outputFormat === 'uint16') {
                    rgb565.push('0x0000');
                } else {
                    rgb565.push('0x00');
                    rgb565.push('0x00');
                }
                continue;
            }

            const r = imgData.data[index];
            const g = imgData.data[index + 1];
            const b = imgData.data[index + 2];

            // Convert RGB888 to RGB565 with rounding.
            const r5 = Math.min(31, (r + 4) >> 3);
            const g6 = Math.min(63, (g + 2) >> 2);
            const b5 = Math.min(31, (b + 4) >> 3);

            const packed = (r5 << 11) | (g6 << 5) | b5;
            // Split RGB565 into little-endian bytes for LVGL image data.
            const lowByte = packed & 0xff;
            const highByte = (packed >> 8) & 0xff;
            // Select output byte order based on the requested endianness.
            const firstByte = byteOrder === 'low' ? lowByte : highByte;
            const secondByte = byteOrder === 'low' ? highByte : lowByte;

            // Emit RGB565 bytes and collect alpha for planar RGB565A8 output.
            if (includeAlpha) {
                rgb565.push(`0x${firstByte.toString(16).padStart(2, '0').toUpperCase()}`);
                rgb565.push(`0x${secondByte.toString(16).padStart(2, '0').toUpperCase()}`);
                alphaBytes.push(`0x${alpha.toString(16).padStart(2, '0').toUpperCase()}`);
            } else if (outputFormat === 'uint16') {
                // Preserve the legacy uint16 byte-order behavior for RGB565 output.
                const packedOutput = byteOrder === 'low' ? (lowByte << 8) | highByte : packed;
                rgb565.push(`0x${packedOutput.toString(16).padStart(4, '0').toUpperCase()}`);
            } else {
                rgb565.push(`0x${firstByte.toString(16).padStart(2, '0').toUpperCase()}`);
                rgb565.push(`0x${secondByte.toString(16).padStart(2, '0').toUpperCase()}`);
            }
        }
    }

    // Append the alpha plane after the color plane for LVGL RGB565A8 output.
    if (includeAlpha) {
        return rgb565.concat(alphaBytes);
    }
    // Return the packed color data for non-alpha output.
    return rgb565;
}

export function buildLvglImageExport(
    image: ImageData,
    backgroundHex: string,
    includeAlpha: boolean = true
): {
    bytes: string[];
    dataSize: number;
    colorFormat: 'LV_COLOR_FORMAT_RGB565' | 'LV_COLOR_FORMAT_RGB565A8';
} {
    // Return a minimal payload when image data is missing.
    if (!image) {
        return {
            bytes: [],
            dataSize: 0,
            colorFormat: includeAlpha ? 'LV_COLOR_FORMAT_RGB565A8' : 'LV_COLOR_FORMAT_RGB565',
        };
    }

    // Choose a source image based on whether alpha should be preserved.
    const source = includeAlpha ? image : flattenImageDataToBackground(image, backgroundHex);
    // Convert the source image to LVGL RGB565 byte output.
    const bytes = imgDataToRGB565_lvgl(source, 0, 0, image.width, image.height, 'low', 'uint8', includeAlpha);
    // Compute the total data size in bytes based on the color format.
    const bytesPerPixel = includeAlpha ? 3 : 2;
    return {
        bytes,
        dataSize: image.width * image.height * bytesPerPixel,
        colorFormat: includeAlpha ? 'LV_COLOR_FORMAT_RGB565A8' : 'LV_COLOR_FORMAT_RGB565',
    };
}

// Convert packed RGB565 arrays back into ImageData for RGB icons/bitmaps.
export function rgb565ToImageData(bitmap: string, width: number, height: number): ImageData {
    const values = bitmap
        .split('\n')
        .filter((line) => !line.trim().startsWith('//'))
        .join('\n')
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .map((value) => parseInt(value, 16));
    const data = new Uint8ClampedArray(width * height * 4);
    const hasColor = values.some((value) => !isNaN(value) && value !== 0);

    for (let i = 0; i < width * height; i++) {
        const pixel = values[i] ?? 0;
        const r = ((pixel >> 11) & 0x1f) << 3;
        const g = ((pixel >> 5) & 0x3f) << 2;
        const b = (pixel & 0x1f) << 3;
        const baseIndex = i * 4;
        data[baseIndex] = r;
        data[baseIndex + 1] = g;
        data[baseIndex + 2] = b;
        data[baseIndex + 3] = pixel === 0 && hasColor ? 0 : 255;
    }

    return new ImageData(data, width, height);
}

export function imgDataToUint32Array(imgData) {
    const length = imgData.data.length / 4; // number of pixels
    const arrayLength = Math.ceil(length / 32);
    let xbmp = new Array(arrayLength).fill(0);
    for (let y = 0; y < imgData.height; y++) {
        for (let x = 0; x < imgData.width; x++) {
            const pixelNumber = y * imgData.width + x; // Overall pixel number in the image
            const imgDataIndex = pixelNumber * 4;
            const alphaValue = imgData.data[imgDataIndex + 3];

            if (alphaValue > 127) {
                const xbmpIndex = Math.floor(pixelNumber / 32); // Index in the xbmp array
                const bitPosition = 31 - (pixelNumber % 32); // Position within the 32-bit chunk
                xbmp[xbmpIndex] |= 1 << bitPosition;
                xbmp[xbmpIndex] >>>= 0; // Convert to unsigned integer
            }
        }
    }

    return xbmp.map((x) => '0x' + x.toString(16));
}

export function xbmpToImgData(xbmp: string, width: number, height: number, swap: boolean = false): ImageData {
    if (!xbmp) {
        throw new Error('xbmpToImgData() xbmp parameter is undefined');
    }
    const sanitizedXbmp = xbmp
        .split('\n')
        .filter((line) => !line.trim().startsWith('//'))
        .join('\n');
    const imgData = new ImageData(width, height);
    const bytesPerRow = Math.ceil(width / 8);
    let xbmpArray = sanitizedXbmp
        .split(',')
        .map((x) => x.trim())
        .filter((x) => x.length > 0)
        .map((x) => parseInt(x));
    if (swap) {
        xbmpArray = xbmpArray.map((x) => bitswap(x));
    }
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const xbmpIndex = y * bytesPerRow + Math.floor(x / 8);
            const bitPosition = x % 8;
            const pixelNumber = y * width + x;
            const imgDataIndex = pixelNumber * 4;
            const alphaValue = (xbmpArray[xbmpIndex] >> bitPosition) & 1 ? 255 : 0;
            imgData.data[imgDataIndex] = 255;
            imgData.data[imgDataIndex + 1] = 255;
            imgData.data[imgDataIndex + 2] = 255;
            imgData.data[imgDataIndex + 3] = alphaValue;
        }
    }
    return imgData;
}

export function toCppVariableName(str) {
    const cppKeywords = [
        'auto',
        'double',
        'int',
        'struct',
        'break',
        'else',
        'long',
        'switch',
        'case',
        'enum',
        'register',
        'typedef',
        'char',
        'extern',
        'return',
        'union',
        'const',
        'float',
        'short',
        'unsigned',
        'continue',
        'for',
        'signed',
        'void',
        'default',
        'goto',
        'sizeof',
        'volatile',
        'do',
        'if',
        'static',
        'while',
    ];

    // Replace non-alphanumeric characters with underscores
    let variableName = str.replace(/[^a-z0-9]/gi, '_');

    // Prepend an underscore if the first character is a digit
    if (/[0-9]/.test(variableName[0])) {
        variableName = '_' + variableName;
    }

    // If name is a C++ keyword, append an underscore
    if (cppKeywords.includes(variableName)) {
        variableName += '_';
    }

    return variableName;
}

export function generateUID() {
    return Math.random().toString(36).substring(2, 9);
}

export function postParentMessage(type, data) {
    if (window.top !== window.self) {
        window.top.postMessage(
            {
                target: 'lopaka_app',
                type: type,
                payload: data,
            },
            '*'
        );
    }
}

export function logEvent(event_name: string, option?: string | number) {
    if (!(import.meta as any).env.PROD) return;
    if (window.gtag) {
        gtag('event', event_name, {
            app_name: 'lopaka',
            option: option,
        });
    }
    if (window.posthog) {
        window.posthog.capture(event_name, {option});
    }
}

export function throttle(func, limit = 5000) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

export function debounce(func, delay = 500) {
    let timeoutId;
    return function () {
        const args = arguments;
        const context = this;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(context, args), delay);
    };
}

// Cache for packImage results
const packImageCache = new Map<string, string>();

// Generate a collision-resistant hash for ImageData contents
function generateImageDataHash(imageData: ImageData): string {
    const data = imageData.data;
    const len = data.length;

    // Early exit keeps empty buffers cheap while still giving a stable key
    if (len === 0) {
        return 'empty';
    }

    // Precompute the 64-bit FNV-1a constants we use for hashing every byte
    const FNV_OFFSET_BASIS = 0xcbf29ce484222325n;
    const FNV_PRIME = 0x100000001b3n;

    // Hash the pixel payload so each individual byte contributes to the fingerprint
    let hash = FNV_OFFSET_BASIS;
    for (let i = 0; i < len; i++) {
        hash ^= BigInt(data[i]);
        hash = BigInt.asUintN(64, hash * FNV_PRIME);
    }

    // Mix in the metadata so identical buffers with different shapes stay unique
    hash ^= BigInt(imageData.width);
    hash = BigInt.asUintN(64, hash * FNV_PRIME);
    hash ^= BigInt(imageData.height);
    hash = BigInt.asUintN(64, hash * FNV_PRIME);

    // Include dimensions and byte-length to make the key human-readable for debugging
    return `${imageData.width}x${imageData.height}-${len}-${hash.toString(16)}`;
}

export function packImage(imageData: ImageData): string {
    const hash = generateImageDataHash(imageData);

    // Check if we have a cached result for this ImageData
    if (packImageCache.has(hash)) {
        return packImageCache.get(hash)!;
    }

    const deflate = new pako.Deflate({level: 9});
    deflate.push(imageData.data, true);
    const result = encode(deflate.result);

    // Cache the result
    packImageCache.set(hash, result);

    // Limit cache size to prevent memory issues
    if (packImageCache.size > 100) {
        // Remove oldest entries (Map maintains insertion order)
        const keysToDelete = Array.from(packImageCache.keys()).slice(0, 50);
        keysToDelete.forEach((key) => packImageCache.delete(key));
    }

    return result;
}

// Function to clear the packImage cache (useful for testing or memory management)
export function clearPackImageCache(): void {
    packImageCache.clear();
}

export function unpackImage(base64: string, width: number, height: number): ImageData | null {
    if (width > 0 && height > 0 && !!base64) {
        const inflate = new pako.Inflate({level: 9});
        const arr = new Uint8Array(decode(base64 ?? ''));
        inflate.push(arr, true);
        return new ImageData(new Uint8ClampedArray(inflate.result), width, height);
    }
    return new ImageData(1, 1);
}
function drawPoints(data, w, h, color) {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d', {
        alpha: true,
        desynchronized: true,
        willReadFrequently: true,
    });
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.beginPath();
    data.forEach((p) => {
        ctx.rect(p[0], p[1], 1, 1);
    });
    ctx.fill();
    ctx.restore();
    return ctx;
}

export function flipImageDataByY(data: ImageData): ImageData {
    const newData = new Uint8ClampedArray(data.data.length);
    for (let y = 0; y < data.height; y++) {
        for (let x = 0; x < data.width; x++) {
            const index = (y * data.width + x) * 4;
            const newIndex = ((data.height - y - 1) * data.width + x) * 4;
            newData[newIndex] = data.data[index];
            newData[newIndex + 1] = data.data[index + 1];
            newData[newIndex + 2] = data.data[index + 2];
            newData[newIndex + 3] = data.data[index + 3];
        }
    }
    return new ImageData(newData, data.width, data.height);
}

export function flipImageDataByX(data: ImageData): ImageData {
    const newData = new Uint8ClampedArray(data.data.length);
    for (let y = 0; y < data.height; y++) {
        for (let x = 0; x < data.width; x++) {
            const index = (y * data.width + x) * 4;
            const newIndex = (y * data.width + data.width - x - 1) * 4;
            newData[newIndex] = data.data[index];
            newData[newIndex + 1] = data.data[index + 1];
            newData[newIndex + 2] = data.data[index + 2];
            newData[newIndex + 3] = data.data[index + 3];
        }
    }
    return new ImageData(newData, data.width, data.height);
}

export function rotateImageData(data: ImageData): ImageData {
    // rotate image 90 degrees
    const newData = new Uint8ClampedArray(data.data.length);
    for (let y = 0; y < data.height; y++) {
        for (let x = 0; x < data.width; x++) {
            const index = (y * data.width + x) * 4;
            const newIndex = (x * data.height + data.height - y - 1) * 4;
            newData[newIndex] = data.data[index];
            newData[newIndex + 1] = data.data[index + 1];
            newData[newIndex + 2] = data.data[index + 2];
            newData[newIndex + 3] = data.data[index + 3];
        }
    }
    return new ImageData(newData, data.height, data.width);
}

export function invertImageData(data: ImageData, hexColor: string, colorMode: string = 'monochrome'): ImageData {
    const newData = new Uint8ClampedArray(data.data.length);

    if (colorMode === 'rgb') {
        for (let i = 0; i < data.data.length; i += 4) {
            const alpha = data.data[i + 3];
            if (alpha === 0) {
                newData[i] = 0;
                newData[i + 1] = 0;
                newData[i + 2] = 0;
                newData[i + 3] = 0;
                continue;
            }

            newData[i] = 255 - data.data[i];
            newData[i + 1] = 255 - data.data[i + 1];
            newData[i + 2] = 255 - data.data[i + 2];
            newData[i + 3] = alpha;
        }
        return new ImageData(newData, data.width, data.height);
    }

    const color = hexToRgb(hexColor);
    for (let i = 0; i < data.data.length; i += 4) {
        if (data.data[i + 3] === 0) {
            newData[i] = color.r;
            newData[i + 1] = color.g;
            newData[i + 2] = color.b;
            newData[i + 3] = 255;
        } else {
            newData[i] = 0;
            newData[i + 1] = 0;
            newData[i + 2] = 0;
            newData[i + 3] = 0;
        }
    }
    return new ImageData(newData, data.width, data.height);
}

export function applyColor(image: ImageData, hex: string) {
    const color = hexToRgb(hex);
    const newData = new Uint8ClampedArray(image.data.length);
    image.data.forEach((v, i) => {
        if (i % 4 === 3 && v !== 0) {
            newData[i - 3] = color.r;
            newData[i - 2] = color.g;
            newData[i - 1] = color.b;
            newData[i] = v;
            return v;
        }
    });
    return new ImageData(newData, image.width, image.height);
}

export function downloadImage(data: ImageData, name: string) {
    const a = document.createElement('a');
    const canvas = document.createElement('canvas');
    canvas.width = data.width;
    canvas.height = data.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(data, 0, 0);
    name = toCppVariableName(name);
    a.href = canvas.toDataURL('image/png');
    a.download = name;
    a.click();
}

export function processImage(
    data: ImageData,
    options: any,
    colorMode: string = 'monochrome',
    color: string = '#FFFFFF'
) {
    let processed = data;

    if (options.grayscale) {
        processed = grayscale(processed);
    }

    const brightness = Number(options.brightness) || 0;
    const contrast = Number(options.contrast) || 0;
    if (brightness !== 0 || contrast !== 0) {
        processed = imageBrightnessAndContrast(processed, brightness, contrast);
    }

    const targetWidth = Math.max(1, Number(options.width) || processed.width);
    const targetHeight = Math.max(1, Number(options.height) || processed.height);
    if (processed.width !== targetWidth || processed.height !== targetHeight) {
        switch (options.resampling) {
            case 'nearest':
                processed = resampleNearest(processed, targetWidth, targetHeight);
                break;
            case 'bilinear':
                processed = resampleBilinear(processed, targetWidth, targetHeight);
                break;
            case 'lanczos':
                processed = resampleWithFilter(processed, targetWidth, targetHeight, lanczosFilter);
                break;
            case 'gaussian':
                processed = resampleWithFilter(processed, targetWidth, targetHeight, gaussianFilter);
                break;
            case 'mitchell':
                processed = resampleWithFilter(processed, targetWidth, targetHeight, mitchellFilter);
                break;
            case 'mitchell-netravali':
                processed = resampleWithFilter(processed, targetWidth, targetHeight, mitchellNetravaliFilter);
                break;
            case 'catmull-rom':
                processed = resampleWithFilter(processed, targetWidth, targetHeight, catmullRomFilter);
                break;
            case 'spline':
                processed = resampleWithFilter(processed, targetWidth, targetHeight, bsplineFilter);
                break;
            default:
                processed = scaleImage(processed, targetWidth, targetHeight);
                break;
        }
    }

    if (options.dither && colorMode !== 'rgb') {
        processed = floydSteinbergDithering(
            processed,
            options.invertPalette ? options.palette.slice(0).reverse() : options.palette
        );
    }

    if (options.alpha && colorMode !== 'rgb') {
        processed = addAlphaChannelToImageData(processed, color);
    }

    if (!options.invert) {
        processed = invertImageData(processed, color, colorMode);
    }

    return processed;
}

export function imageBrightnessAndContrast(data: ImageData, brightness: number, contrast: number) {
    const factor = (101 + contrast) / 50;
    const newData = new Uint8ClampedArray(data.data.length);
    for (let i = 0; i < data.data.length; i += 4) {
        newData[i] = factor * (data.data[i] - 128) + 128 + brightness;
        newData[i + 1] = factor * (data.data[i + 1] - 128) + 128 + brightness;
        newData[i + 2] = factor * (data.data[i + 2] - 128) + 128 + brightness;
        newData[i + 3] = data.data[i + 3];
    }
    return new ImageData(newData, data.width, data.height);
}

export function grayscale(data: ImageData) {
    const newData = new Uint8ClampedArray(data.data.length);
    for (let i = 0; i < data.data.length; i += 4) {
        const avg = (data.data[i] + data.data[i + 1] + data.data[i + 2]) / 3;
        newData[i] = avg;
        newData[i + 1] = avg;
        newData[i + 2] = avg;
        newData[i + 3] = data.data[i + 3];
    }
    return new ImageData(newData, data.width, data.height);
}

export function cropImage(data: ImageData, rect: UnwrapRef<Rect>) {
    const newData = new Uint8ClampedArray(rect.w * rect.h * 4);
    for (let y = rect.y; y < rect.y + rect.h; y++) {
        for (let x = rect.x; x < rect.x + rect.w; x++) {
            const index = (y * data.width + x) * 4;
            const newIndex = ((y - rect.y) * rect.w + (x - rect.x)) * 4;
            newData[newIndex] = data.data[index];
            newData[newIndex + 1] = data.data[index + 1];
            newData[newIndex + 2] = data.data[index + 2];
            newData[newIndex + 3] = data.data[index + 3];
        }
    }
    return new ImageData(newData, rect.w, rect.h);
}

export function cropImageRGB(data: ImageData, rect: UnwrapRef<Rect>): ImageData {
    const newData = new Uint8ClampedArray(rect.w * rect.h * 4);
    for (let y = rect.y; y < rect.y + rect.h; y++) {
        for (let x = rect.x; x < rect.x + rect.w; x++) {
            const index = (y * data.width + x) * 4;
            const newIndex = ((y - rect.y) * rect.w + (x - rect.x)) * 4;

            // Just copy the RGBA data normally - no color conversion needed
            newData[newIndex] = data.data[index];
            newData[newIndex + 1] = data.data[index + 1];
            newData[newIndex + 2] = data.data[index + 2];
            newData[newIndex + 3] = data.data[index + 3];
        }
    }
    return new ImageData(newData, rect.w, rect.h);
}

export function scaleImage(data: ImageData, width: number, height: number) {
    const canvas = new OffscreenCanvas(data.width, data.height);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(data, 0, 0);
    const canvas2 = new OffscreenCanvas(width, height);
    const ctx2 = canvas2.getContext('2d');
    ctx2.imageSmoothingEnabled = false;
    ctx2.drawImage(canvas, 0, 0, width, height);
    return ctx2.getImageData(0, 0, width, height);
}

export function resampleBilinear(data: ImageData, width: number, height: number) {
    // scaling with bilinear interpolation
    const newData = new Uint8ClampedArray(width * height * 4);
    const xRatio = data.width / width;
    const yRatio = data.height / height;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const px = x * xRatio;
            const py = y * yRatio;
            const x1 = Math.floor(px);
            const x2 = Math.ceil(px);
            const y1 = Math.floor(py);
            const y2 = Math.ceil(py);
            const dx = px - x1;
            const dy = py - y1;
            const index1 = (y1 * data.width + x1) * 4;
            const index2 = (y1 * data.width + x2) * 4;
            const index3 = (y2 * data.width + x1) * 4;
            const index4 = (y2 * data.width + x2) * 4;
            const newIndex = (y * width + x) * 4;
            for (let j = 0; j < 4; j++) {
                newData[newIndex + j] =
                    data.data[index1 + j] * (1 - dx) * (1 - dy) +
                    data.data[index2 + j] * dx * (1 - dy) +
                    data.data[index3 + j] * (1 - dx) * dy +
                    data.data[index4 + j] * dx * dy;
            }
        }
    }
    return new ImageData(newData, width, height);
}

export function resampleNearest(data: ImageData, width: number, height: number) {
    // scaling with nearest neighbor algorithm
    const newData = new Uint8ClampedArray(width * height * 4);
    const xRatio = data.width / width;
    const yRatio = data.height / height;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (Math.floor(y * yRatio) * data.width + Math.floor(x * xRatio)) * 4;
            const newIndex = (y * width + x) * 4;
            newData[newIndex] = data.data[index];
            newData[newIndex + 1] = data.data[index + 1];
            newData[newIndex + 2] = data.data[index + 2];
            newData[newIndex + 3] = data.data[index + 3];
        }
    }
    return new ImageData(newData, width, height);
}

export function resampleWithFilter(data: ImageData, width: number, height: number, filter: Function) {
    const newData = new Uint8ClampedArray(width * height * 4);
    const xRatio = data.width / width;
    const yRatio = data.height / height;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0,
                g = 0,
                b = 0,
                a = 0;
            for (let j = Math.floor(y * yRatio); j < Math.ceil(y * yRatio + 1); j++) {
                for (let i = Math.floor(x * xRatio); i < Math.ceil(x * xRatio + 1); i++) {
                    if (i >= 0 && i < data.width && j >= 0 && j < data.height) {
                        const index = (j * data.width + i) * 4;
                        const dx = Math.abs(x * xRatio - i);
                        const dy = Math.abs(y * yRatio - j);
                        const weight = filter(dx) * filter(dy);
                        r += data.data[index] * weight;
                        g += data.data[index + 1] * weight;
                        b += data.data[index + 2] * weight;
                        a += data.data[index + 3] * weight;
                    }
                }
            }
            const newIndex = (y * width + x) * 4;
            newData[newIndex] = r;
            newData[newIndex + 1] = g;
            newData[newIndex + 2] = b;
            newData[newIndex + 3] = a;
        }
    }
    return new ImageData(newData, width, height);
}

function mitchellFilter(x) {
    return x < 1 ? (16 + x * x * (21 * x - 36)) / 18 : x < 2 ? (32 + x * (-60 + x * (36 - 7 * x))) / 18 : 0;
}

function catmullRomFilter(x) {
    return x < 1 ? 0.5 * (2 + x * x * (-5 + 3 * x)) : x < 2 ? 0.5 * (4 + x * (-8 + x * (5 - x))) : 0;
}
function gaussianFilter(x) {
    return Math.exp(-2 * x * x);
}

function mitchellNetravaliFilter(x) {
    return x < 1 ? (21 + x * x * (30 * x - 36)) / 18 : x < 2 ? (39 + x * (-54 + x * (27 - 5 * x))) / 18 : 0;
}

function bsplineFilter(x) {
    return x < 1 ? (4 + x * x * (-6 + 3 * x)) / 6 : x < 2 ? (8 + x * (-12 + x * (6 - x))) / 6 : 0;
}

function lanczosFilter(x) {
    return x == 0 ? 1 : (Math.sin(Math.PI * x) * Math.sin((Math.PI * x) / 3)) / ((Math.PI * x * (Math.PI * x)) / 3);
}

export function floydSteinbergDithering(data: ImageData, palette: string[]) {
    const newData = new Uint8ClampedArray(data.data.length);
    const colors = palette.map((c) => hexToRgb(c));
    for (let y = 0; y < data.height; y++) {
        for (let x = 0; x < data.width; x++) {
            const index = (y * data.width + x) * 4;
            const [r, g, b] = Array.from(data.data.slice(index, index + 3));
            let min = 255 * 3;
            let index2 = 0;
            for (let j = 0; j < colors.length; j++) {
                const [r2, g2, b2] = Object.values(colors[j]);
                const d = Math.pow(r - r2, 2) + Math.pow(g - g2, 2) + Math.pow(b - b2, 2);
                if (d < min) {
                    min = d;
                    index2 = j;
                }
            }
            const [r2, g2, b2] = Object.values(colors[index2]);
            newData[index] = r2;
            newData[index + 1] = g2;
            newData[index + 2] = b2;
            newData[index + 3] = data.data[index + 3];
            const er = r - r2;
            const eg = g - g2;
            const eb = b - b2;
            const d1 = (y * data.width + x + 1) * 4;
            const d2 = ((y + 1) * data.width + x - 1) * 4;
            const d3 = (y * data.width + x) * 4;
            const d4 = ((y + 1) * data.width + x) * 4;
            if (x < data.width - 1) {
                data.data[d1] += (er * 7) / 16;
                data.data[d1 + 1] += (eg * 7) / 16;
                data.data[d1 + 2] += (eb * 7) / 16;
            }
            if (y < data.height - 1 && x > 0) {
                data.data[d2] += (er * 3) / 16;
                data.data[d2 + 1] += (eg * 3) / 16;
                data.data[d2 + 2] += (eb * 3) / 16;
            }
        }
    }
    return new ImageData(newData, data.width, data.height);
}

export function createEmptyImageDataURL(w: number, h: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const data = canvas.toDataURL();
    canvas.remove();
    return data;
}

export function downloadAsFile(filename: string, content: string | Blob, type: string): void {
    const link = document.createElement('a');
    link.download = filename;

    if (typeof content === 'string') {
        link.href = content;
    } else {
        link.href = URL.createObjectURL(content);
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (type === 'blob') {
        URL.revokeObjectURL(link.href);
    }
}

export function canvasToBMPFile(canvas, scaling = 1, bgColor): Blob {
    const width = canvas.width * scaling;
    const height = canvas.height * scaling;

    // Create scaled canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');

    // Fill with background color and draw scaled image
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;
    ctx.scale(scaling, scaling);
    ctx.drawImage(canvas, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // BMP file header (14 bytes)
    const fileHeaderSize = 14;
    const dibHeaderSize = 40; // BITMAPINFOHEADER
    const bitsPerPixel = 24;
    const rowSize = Math.floor((bitsPerPixel * width + 31) / 32) * 4;
    const paddingSize = rowSize - width * 3; // Calculate padding bytes per row
    const imageSize = rowSize * height;
    const fileSize = fileHeaderSize + dibHeaderSize + imageSize;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // BMP File Header
    view.setUint8(0, 0x42); // 'B'
    view.setUint8(1, 0x4d); // 'M'
    view.setUint32(2, fileSize, true); // File size
    view.setUint32(6, 0, true); // Reserved
    view.setUint32(10, fileHeaderSize + dibHeaderSize, true); // Pixel data offset

    // DIB Header (BITMAPINFOHEADER)
    view.setUint32(14, dibHeaderSize, true); // Header size
    view.setInt32(18, width, true); // Width
    view.setInt32(22, -height, true); // Height (negative for top-to-bottom)
    view.setUint16(26, 1, true); // Color planes
    view.setUint16(28, bitsPerPixel, true); // Bits per pixel
    view.setUint32(30, 0, true); // Compression (none)
    view.setUint32(34, imageSize, true); // Image size
    view.setInt32(38, 2835, true); // X pixels per meter
    view.setInt32(42, 2835, true); // Y pixels per meter
    view.setUint32(46, 0, true); // Colors in palette
    view.setUint32(50, 0, true); // Important colors

    // Pixel data
    let offset = fileHeaderSize + dibHeaderSize;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixelOffset = (y * width + x) * 4;
            view.setUint8(offset++, data[pixelOffset + 2]); // Blue
            view.setUint8(offset++, data[pixelOffset + 1]); // Green
            view.setUint8(offset++, data[pixelOffset]); // Red
        }
        // Add padding bytes to ensure each row is aligned to 4 bytes
        for (let p = 0; p < paddingSize; p++) {
            view.setUint8(offset++, 0);
        }
    }

    return new Blob([buffer], {type: 'image/bmp'});
}

export function imgDataToBuffer(
    imgData: ImageData,
    xStart: number,
    yStart: number,
    width: number,
    height: number
): string {
    if (!imgData) {
        return "b''";
    }

    // Calculate bytes per row (8 pixels per byte)
    const bytesPerRow = Math.ceil(width / 8);
    const buffer = new Uint8Array(height * bytesPerRow);

    // Convert image data to monochrome buffer
    for (let y = yStart; y < yStart + height; y++) {
        for (let x = xStart; x < xStart + width; x++) {
            const imgDataIndex = (y * imgData.width + x) * 4;
            const alphaValue = imgData.data[imgDataIndex + 3];

            // Convert to monochrome (1 for white/visible, 0 for black/transparent)
            if (alphaValue > 127) {
                const bufferIndex = (y - yStart) * bytesPerRow + Math.floor((x - xStart) / 8);
                const bitPosition = 7 - ((x - xStart) % 8); // MSB first
                buffer[bufferIndex] |= 1 << bitPosition;
            }
        }
    }

    // Convert to Python byte string format
    const bytes = Array.from(buffer)
        .map((b) => {
            // Escape special characters and format as hex
            if (b === 0x22 || b === 0x27 || b === 0x5c) {
                // ", ', \
                return `\\x${b.toString(16).padStart(2, '0')}`;
            }
            // Use ASCII for printable characters
            if (b >= 0x20 && b <= 0x7e) {
                return String.fromCharCode(b);
            }
            // Use hex for non-printable characters
            return `\\x${b.toString(16).padStart(2, '0')}`;
        })
        .join('');

    return `b'${bytes}'`;
}

// Convert a 1bpp buffer into RGBA ImageData.
export function bufferToImageData(buffer: Uint8Array, width: number, height: number): ImageData {
    const imgData = new ImageData(width, height);
    const bytesPerRow = Math.ceil(width / 8);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const byteIndex = y * bytesPerRow + Math.floor(x / 8);
            const bitPosition = 7 - (x % 8);
            const alpha = (buffer[byteIndex] >> bitPosition) & 1 ? 255 : 0;
            const idx = (y * width + x) * 4;
            imgData.data[idx] = 255;
            imgData.data[idx + 1] = 255;
            imgData.data[idx + 2] = 255;
            imgData.data[idx + 3] = alpha;
        }
    }
    return imgData;
}
