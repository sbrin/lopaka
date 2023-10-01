import { codeDeclarators, fontMap, textCharWidth } from './const';

function bitswap(b) {
    b = (b & 0xF0) >> 4 | (b & 0x0F) << 4;
    b = (b & 0xCC) >> 2 | (b & 0x33) << 2;
    b = (b & 0xAA) >> 1 | (b & 0x55) << 1;
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

export function scaleUp(i) {
    return 4 * i;
}

export function scaleDown(i) {
    return Math.round(i / 4);
}

export function scaleSize(i) {
    return i > 0 ? Math.round(i / 4) : Math.floor(i / 4);
}

export function getElementByOffset(layersArr, x, y) {
    for (let i = layersArr.length - 1; i >= 0; i--) {
        const element = layersArr[i];
        const scaledX1 = scaleUp(element.x);
        const scaledY1 = scaleUp(element.yy ? element.yy : element.y);
        const scaledX2 = scaleUp(element.x + element.width);
        const scaledY2 = scaleUp(element.yy ? element.yy + element.height : element.y + element.height);
        if (element.type === 'line') {
            const scaledX1 = scaleUp(element.x);
            const scaledY1 = scaleUp(element.y);
            const scaledX2 = scaleUp(element.x2);
            const scaledY2 = scaleUp(element.y2);
            if (scaledX2 > scaledX1) {
                const isXInside = x >= scaledX1 - 4 && x <= scaledX2 + 4;
                if (scaledY2 > scaledY1) {
                    if (isXInside && y >= scaledY1 - 4 && y <= scaledY2 + 4) {
                        return element;
                    }
                } else {
                    if (isXInside && y <= scaledY1 + 4 && y >= scaledY2 - 4) {
                        return element;
                    }
                }
            } else {
                const isXInside = x <= scaledX1 + 4 && x >= scaledX2 - 4;
                if (scaledY2 > scaledY1) {
                    if (isXInside && y >= scaledY1 - 4 && y <= scaledY2 + 4) {
                        return element;
                    }
                } else {
                    if (isXInside && y <= scaledY1 + 4 && y >= scaledY2 - 4) {
                        return element;
                    }
                }
            }
        } else if (scaledX1 <= x && scaledX2 >= x && scaledY1 <= y && scaledY2 >= y) {
            return element;
        }
    }
}

export async function loadImageAsync(src): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.src = src;
        img.onerror = reject;
        img.onload = () => resolve(img);
    });
}

export function imgDataToXBMP(imgData, xStart, yStart, width, height, swapBits = false) {
    const bytesPerRow = Math.ceil(width / 8);
    const xbmp = new Array(height * bytesPerRow).fill(0);

    for (let y = yStart; y < yStart + height; y++) {
        for (let x = xStart; x < xStart + width; x++) {
            const imgDataIndex = (y * width + x) * 4;
            const rgbSumValue = imgData.data[imgDataIndex] + imgData.data[imgDataIndex + 1] + imgData.data[imgDataIndex + 2];
            const alphaValue = imgData.data[imgDataIndex + 3];
            // b&w + alpha masking
            if (alphaValue > 127 && rgbSumValue < 381) {
                const xbmpIndex =
                    (y - yStart) * bytesPerRow + Math.floor((x - xStart) / 8);
                const bitPosition = (x - xStart) % 8;
                xbmp[xbmpIndex] |= 1 << bitPosition;
            }
        }
    }

    for (let i = 0; i < xbmp.length; i++) {
        xbmp[i] = swapBits ? bitswap(xbmp[i]) : xbmp[i];
        xbmp[i] = "0x" + xbmp[i].toString(16).padStart(2, "0");
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

export function getUint32Code(context) {
    let result = ``;
    const imgData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    const UINT32 = imgDataToUint32Array(imgData);

    const iconName = `image_frame`;
    result += `const uint32_t ${iconName}[] = {${UINT32}};
`;
    return result;
}

export function getU8g2Code(element) {
    const type = element.type.charAt(0).toUpperCase() + element.type.slice(1);
    const func = `u8g2.draw${type}`;
    const {width, height, x, y} = element;
    const font = fontMap['u8g2'][element.font];
    switch (element.type) {
        case 'icon':
        case 'draw':
            const name = `image_${element.name}_bits`;
            return `u8g2.drawXBMP( ${x}, ${y}, ${width}, ${height}, ${name});\n`;
        case 'box':
            return `${func}(${x}, ${y}, ${width}, ${height});\n`;
        case 'dot':
            return `u8g2.drawPixel(${x}, ${y});\n`;
        case 'frame':
            return `${func}(${x}, ${y}, ${width + 1}, ${height + 1});\n`;
        case 'line':
            return `${func}(${x}, ${y}, ${element.x2}, ${element.y2});\n`;
        case 'circle':
        case 'disc':
            return `${func}(${x + element.radius}, ${y + element.radius}, ${element.radius});\n`;
        case 'str':
            return `u8g2.setFont(${font});
${func}(${x}, ${y}, "${element.text}");\n`;
    }
}

export function getU8g2Declarations(element, imageData) {
    const {width, height} = element;
    const XBMP = imgDataToXBMP(imageData, 0, 0, width, height);
    const name = `image_${element.name}_bits`;
    return `static const unsigned char ${name}[] U8X8_PROGMEM = {${XBMP}};
`;
}

export function getFlipperDeclarations(element) {
    if (element.isCustom) {
        return `extern const Icon I_${element.name};\n`;
    }
    // if (element.type === "draw") {
    //   return getU8g2Declarations(element);
    // }
    return '';
}

export function getAdafruitFGXDeclarations(element, imageData) {
    const { width, height } = element;
    const XBMP = imgDataToXBMP(imageData, 0, 0, width, height, true);
    const name = `image_${element.name}_bits`;
    return `static const unsigned char PROGMEM ${name}[] = {${XBMP}};\n`;
}

export function getFlipperCode(element) {
    const func = `canvas_draw_${element.type}`;
    const font = fontMap['flipper'][element.font];
    const {name, width, height, x, y} = element;
    switch (element.type) {
        case 'draw':
            return '';
        //   const varName = `image_${name}_bits`;
        //   return `u8g2.drawXBMP( ${x}, ${y}, ${width}, ${height}, ${varName});`;
        case 'icon':
            return `${func}(canvas, ${x}, ${y}, &I_${name});\n`;
        case 'box':
            return `${func}(canvas, ${x}, ${y}, ${width}, ${height});\n`;
        case 'dot':
            return `${func}(canvas, ${x}, ${y});\n`;
        case 'frame':
            return `${func}(canvas, ${x}, ${y}, ${width + 1}, ${height + 1});\n`;
        case 'line':
            return `${func}(canvas, ${x}, ${y}, ${element.x2}, ${element.y2});\n`;
        case 'circle':
        case 'disc':
            return `${func}(canvas, ${x + element.radius}, ${y + element.radius}, ${element.radius});\n`;
        case 'str':
            return `canvas_set_font(canvas, ${font});
${func}(canvas, ${x}, ${y}, "${element.text}");\n`;
        default:
            break;
    }
}

export function getAdafruitFGXCode(element) {
    const {width, height, x, y} = element;
    const color = 1;
    const fontSize = 1;
    switch (element.type) {
        case 'icon':
        case 'draw':
            const name = `image_${element.name}_bits`;
            return `display.drawBitmap( ${x}, ${y}, ${name}, ${width}, ${height}, ${color});\n`;
        case 'dot':
            return `display.drawPixel(${x}, ${y}, ${color});\n`;
        case 'box':
            return `display.fillRect(${x}, ${y}, ${width}, ${height}, ${color});\n`;
        case 'frame':
            return `display.drawRect(${x}, ${y}, ${width + 1}, ${height + 1}, ${color});\n`;
        case 'line':
            return `display.drawLine(${x}, ${y}, ${element.x2}, ${element.y2}, ${color});\n`;
        case 'circle':
            return `display.drawCircle(${x + element.radius}, ${y + element.radius}, ${element.radius}, ${color});\n`;
        case 'disc':
            return `display.fillCircle(${x + element.radius}, ${y + element.radius}, ${element.radius}, ${color});\n`;
        case 'str':
            return `display.setTextColor(${color});
display.setTextSize(${fontSize});
display.setCursor(${x}, ${y});
display.setTextWrap(false);
display.print("${element.text}");\n`;
    }
}

export function getCodeSettings(library) {
    switch (library) {
        case 'u8g2':
            return 'u8g2.setBitmapMode(1);\n';
        case 'flipper':
            return 'canvas_set_bitmap_mode(canvas, 1);\n';
        default:
            return '';
    }
}

export function generateCode(screenElements, library, context, imageDataCache) {
    const codeGenerators = {
        flipper: getFlipperCode,
        u8g2: getU8g2Code,
        uint32: getUint32Code,
        adafruit_gfx: getAdafruitFGXCode
    };

    if (library === 'uint32') {
        return getUint32Code(context);
    }
    let lines = '';
    let settings = '';
    let declarations = '';
    if (library === 'flipper' && screenElements.find((i) => i.type === 'draw')) {
        declarations +=
            '// DRAW tool is not yet supported for Flipper Zero, sorry. It is being ignored from code output\n';
    }
    const declaredIcons = [];
    for (let i = 0; i < screenElements.length; i++) {
        const element = screenElements[i];
        if (element.isOverlay) {
            continue;
        }
        if (['icon', 'draw'].includes(element.type) && !!codeDeclarators[library]) {
            // avoid duplicate icon declarations
            const isDeclared = declaredIcons.indexOf(element.name) >= 0;
            if (!isDeclared) {
                const imageData = imageDataCache[element.name];
                declaredIcons.push(element.name);
                declarations = `${declarations}${codeDeclarators[library](element, imageData)}`;
            }
        }
        lines = `${lines}${codeGenerators[library](element)}`;
    }
    if (screenElements.length) {
        settings += getCodeSettings(library);
    }
    return `${declarations}${settings}${lines}`;
}

export function getTextWidth(text, font) {
    return textCharWidth[font] * text.length;
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
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
