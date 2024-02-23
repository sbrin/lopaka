import {decode, encode} from 'base64-arraybuffer';
import pako from 'pako';
function bitswap(b) {
    b = ((b & 0xf0) >> 4) | ((b & 0x0f) << 4);
    b = ((b & 0xcc) >> 2) | ((b & 0x33) << 2);
    b = ((b & 0xaa) >> 1) | ((b & 0x55) << 1);
    return b;
}

export function readFileAsync(file) {
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
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
}

export function hexToRgb(hexColor: string) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return {r, g, b};
}

export function packedHexColor(color: string) {
    const c = packColor565(color);
    return `0x${c.toString(16).toUpperCase()}`;
}

export function packColor565(hexColor: string) {
    const rgb = hexToRgb(hexColor);
    return ((rgb.r >> 3) << 11) | ((rgb.g >> 2) << 5) | (rgb.b >> 3);
}

export function inverImageDataWithAlpha(imgData: ImageData) {
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        let [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
        // if alpha more than 50%
        if (r + g + b > 255 / 2 || a < 255 / 2) {
            // transparent
            a = 0;
            r = g = b = 0;
        } else {
            // white pixels
            r = g = b = 255;
            a = 255;
        }
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = a;
    }
    return imgData;
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
    return Date.now().toString(32);
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
