import {decode, encode} from 'base64-arraybuffer';
import pako from 'pako';

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

export async function readFileAsync(file): Promise<string | ArrayBuffer> {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
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

export function imgDataToXBMP(
    imgData: ImageData,
    xStart: number,
    yStart: number,
    width: number,
    height: number,
    swapBits: boolean = false
): string[] {
    if (!imgData) {
        return;
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
    const imgData = new ImageData(width, height);
    const bytesPerRow = Math.ceil(width / 8);
    let xbmpArray = xbmp.split(',').map((x) => parseInt(x));
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
        'while'
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
        window.top.postMessage({target: 'lopaka_app', type: type, payload: data}, '*');
    }
}

export function logEvent(event_name: string, option?: string) {
    window.gtag &&
        gtag('event', event_name, {
            app_name: 'lopaka',
            option: option
        });
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

export function packImage(imageData: ImageData): string {
    const deflate = new pako.Deflate({level: 9});
    deflate.push(imageData.data, true);
    return encode(deflate.result);
}

export function unpackImage(base64: string, width: number, height: number): ImageData {
    const inflate = new pako.Inflate({level: 9});
    const arr = new Uint8Array(decode(base64));
    inflate.push(arr, true);
    return new ImageData(new Uint8ClampedArray(inflate.result), width, height);
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

export function invertImageData(data: ImageData, hexColor: string): ImageData {
    const color = hexToRgb(hexColor);
    const newData = new Uint8ClampedArray(data.data.length);
    for (let i = 0; i < data.data.length; i += 4) {
        if (data.data[i + 3] == 0) {
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
    a.href = canvas.toDataURL('image/png');
    a.download = name;
    a.click();
}

export function processImage(data: ImageData, options: any, color: string = '#FFFFFF') {
    if (options.brightness) {
        data = imageBrightness(data, options.brightness);
    }
    switch (options.resampling) {
        case 'nearest':
            data = resampleNearest(data, options.width, options.height);
            break;
        case 'bilinear':
            data = resampleBilinear(data, options.width, options.height);
            break;
        case 'lanczos':
            data = resampleWithFilter(data, options.width, options.height, lanczosFilter);
            break;
        case 'gaussian':
            data = resampleWithFilter(data, options.width, options.height, gaussianFilter);
            break;
        case 'mitchell':
            data = resampleWithFilter(data, options.width, options.height, mitchellFilter);
            break;
        case 'mitchell-netravali':
            data = resampleWithFilter(data, options.width, options.height, mitchellNetravaliFilter);
            break;
        case 'catmull-rom':
            data = resampleWithFilter(data, options.width, options.height, catmullRomFilter);
            break;
        case 'bspline':
            data = resampleWithFilter(data, options.width, options.height, bsplineFilter);
            break;
        default:
            data = scaleImage(data, options.width, options.height);
            break;
    }
    if (options.dither) {
        data = floydSteinbergDithering(data, options.palette);
    }
    if (options.alpha) {
        data = addAlphaChannelToImageData(data, color);
    }
    if (options.invert) {
        data = invertImageData(data, color);
    }
    return data;
}

export function imageBrightness(data: ImageData, brightness: number) {
    const newData = new Uint8ClampedArray(data.data.length);
    for (let i = 0; i < data.data.length; i += 4) {
        newData[i] = Math.min(255, data.data[i] + brightness);
        newData[i + 1] = Math.min(255, data.data[i + 1] + brightness);
        newData[i + 2] = Math.min(255, data.data[i + 2] + brightness);
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
