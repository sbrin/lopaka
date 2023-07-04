function bline(imgData, x0, y0, x1, y1, canvasWidth, canvasHeight, scale) {
    const resultArr = [];
    const dx = Math.abs(x1 - x0),
        sx = x0 < x1 ? 1 : -1;
    const dy = Math.abs(y1 - y0),
        sy = y0 < y1 ? 1 : -1;
    let err = (dx > dy ? dx : -dy) / 2;
    while (true) {
        if (x0 >= 0 && x0 < canvasWidth && y0 >= 0 && y0 < canvasHeight) {
            resultArr.push([x0, y0]);
        }
        if (x0 === x1 && y0 === y1) break;
        var e2 = err;
        if (e2 > -dx) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dy) {
            err += dx;
            y0 += sy;
        }
    }
    for (let i = 0; i < resultArr.length; i++) {
        const [x, y] = resultArr[i];
        const n = (y * canvasWidth + x) * scale;

        imgData.data[n] = 0;
        imgData.data[n + 1] = 0;
        imgData.data[n + 2] = 0;
        imgData.data[n + 3] = 255;
    }
}

function drawCircle(imgData, centerX, centerY, radius, canvasWidth, canvasHeight) {
    const resultArr = [];
    let x = 0;
    let y = radius;
    let d = 3 - 2 * radius;

    while (x <= y) {
        const points = [
            [centerX + x, centerY + y],
            [centerX - x, centerY + y],
            [centerX + x, centerY - y],
            [centerX - x, centerY - y],
            [centerX + y, centerY + x],
            [centerX - y, centerY + x],
            [centerX + y, centerY - x],
            [centerX - y, centerY - x],
        ];

        points.forEach(([x, y]) => {
            if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
                resultArr.push([x, y]);
            }
        });

        if (d < 0) {
            d = d + 4 * x + 6;
        } else {
            d = d + 4 * (x - y) + 10;
            y--;
        }
        x++;
    }

    for (let i = 0; i < resultArr.length; i++) {
        const [x, y] = resultArr[i];
        const n = (y * canvasWidth + x) * 4;

        imgData.data[n] = 0;
        imgData.data[n + 1] = 0;
        imgData.data[n + 2] = 0;
        imgData.data[n + 3] = 255;
    }
}

function drawDisc(imgData, centerX, centerY, radius, canvasWidth, canvasHeight) {
    const resultArr = [];
    let x = 0;
    let y = radius;
    let d = 3 - 2 * radius;

    while (x <= y) {
        for (let i = -x; i <= x; i++) {
            resultArr.push([centerX + i, centerY + y]);
            resultArr.push([centerX + i, centerY - y]);
        }

        for (let i = -y; i <= y; i++) {
            resultArr.push([centerX + i, centerY + x]);
            resultArr.push([centerX + i, centerY - x]);
        }

        if (d < 0) {
            d = d + 4 * x + 6;
        } else {
            d = d + 4 * (x - y) + 10;
            y--;
        }
        x++;
    }

    for (let i = 0; i < resultArr.length; i++) {
        const [x, y] = resultArr[i];
        if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
            const n = (y * canvasWidth + x) * 4;
            imgData.data[n] = 0;
            imgData.data[n + 1] = 0;
            imgData.data[n + 2] = 0;
            imgData.data[n + 3] = 255;
        }
    }
}

function maskBlack(context, isInverted, canvasWidth, canvasHeight) {
    const imgData = context.getImageData(
        0,
        0,
        canvasWidth,
        canvasHeight
    )
    for (var i = 0; i < imgData.data.length; i += 4) {
        if (
            imgData.data[i + 3] === 255
            &&
            imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2] <= 381) {
            imgData.data[i] = 0; // R
            imgData.data[i + 1] = 0; // G
            imgData.data[i + 2] = 0; // B
            imgData.data[i + 3] = 255; // alpha
        } else {
            imgData.data[i + 3] = 0; // alpha
        }
    }
    return imgData;
}

function readFileAsync(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function scaleUp(i) {
    return 4 * i;
}

function scaleDown(i) {
    return Math.round(i / 4);
}

function scaleSize(i) {
    return i > 0 ? Math.round(i / 4) : Math.floor(i / 4);
}

function getElementByOffset(layersArr, x, y) {
    for (let i = layersArr.length - 1; i >= 0; i--) {
        const element = layersArr[i];
        const scaledX1 = scaleUp(element.x);
        const scaledY1 = scaleUp(element.yy ? element.yy : element.y);
        const scaledX2 = scaleUp(element.x + element.width);
        const scaledY2 = scaleUp(element.yy ? element.yy + element.height : element.y + element.height);
        if (element.type === "line") {
            const scaledX1 = scaleUp(element.x);
            const scaledY1 = scaleUp(element.y);
            const scaledX2 = scaleUp(element.x2);
            const scaledY2 = scaleUp(element.y2);
            if (scaledX2 > scaledX1) {
                const isXInside = x >= scaledX1 - 4 && x <= scaledX2 + 4;
                if (scaledY2 > scaledY1) {
                    if (isXInside && y >= scaledY1 - 4 && y <= scaledY2 + 4) {
                        return element;
                    };
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

function loadImageAsync(src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.src = src;
        img.onerror = reject;
        img.onload = () => resolve(img);
    })
}

function imgDataToXBMP(imgData, xStart, yStart, width, height) {
    const bytesPerRow = Math.ceil(width / 8);
    const xbmp = new Array(height * bytesPerRow).fill(0);

    for (let y = yStart; y < yStart + height; y++) {
        for (let x = xStart; x < xStart + width; x++) {
            const imgDataIndex = (y * width + x) * 4;
            const alphaValue = imgData.data[imgDataIndex + 3];

            if (alphaValue > 127) {
                const xbmpIndex = (y - yStart) * bytesPerRow + Math.floor((x - xStart) / 8);
                const bitPosition = (x - xStart) % 8;
                xbmp[xbmpIndex] |= 1 << bitPosition;
            }
        }
    }

    return xbmp.map(x => '0x' + x.toString(16).padStart(2, '0'));
}

function imgDataToUint32Array(imgData) {
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
                xbmp[xbmpIndex] >>>= 0;  // Convert to unsigned integer
            }
        }
    }
    
    return xbmp.map(x => '0x' + x.toString(16));
}

function getUint32Code(context) {
    let result = ``;
    const imgData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    const UINT32 = imgDataToUint32Array(imgData);

    const iconName = `image_frame`;
    result += `const uint32_t ${iconName}[] = {${UINT32}};
`;
    return result;
};

function getU8g2Code(element, isDeclared, context) {
    const type = element.type.charAt(0).toUpperCase() + element.type.slice(1);
    const func = `u8g2.draw${type}`;
    const { width, height, x, y } = element;
    const font = fontMap["u8g2"][element.font];
    switch (element.type) {
        case "icon":
            let result = ``;
            const imgData = context.getImageData(x, y, width, height);
            const XBMP = imgDataToXBMP(imgData, 0, 0, width, height);
            const iconName = `icon_${element.name}_bits`;
            if (!isDeclared) {
                result += `static unsigned char ${iconName}[] = {${XBMP}};
`;
            }
            result += `u8g2.drawXBM( ${x}, ${y}, ${width}, ${height}, ${iconName});`;
            return result;
        case "box":
            return `${func}(${element.x}, ${element.y}, ${element.width}, ${element.height});`;
        case "dot":
            return `u8g2.drawPixel(${element.x}, ${element.y})`;
        case "frame":
            return `${func}(${element.x}, ${element.y}, ${element.width + 1}, ${element.height + 1});`;
        case "line":
            return `${func}(${element.x}, ${element.y}, ${element.x2}, ${element.y2});`;
        case "circle":
        case "disc":
            return `${func}(${element.x + element.radius}, ${element.y + element.radius}, ${element.radius});`;
        case "str":
            return `u8g2.setFont(${font});
${func}(${element.x}, ${element.y}, "${element.text}");`;
    }
};


function getFlipperCode(element, isDeclared) {
    const func = `canvas_draw_${element.type}`;
    const font = fontMap["flipper"][element.font];
    switch (element.type) {
        case "icon":
            let result = element.isCustom && !isDeclared ? `extern const Icon I_${element.name};\n` : ``;
            result += `${func}(canvas, ${element.x}, ${element.y}, &I_${element.name})`;
            return result;
        case "box":
            return `${func}(canvas, ${element.x}, ${element.y}, ${element.width}, ${element.height});`;
        case "dot":
            return `${func}(canvas, ${element.x}, ${element.y});`;
        case "frame":
            return `${func}(canvas, ${element.x}, ${element.y}, ${element.width + 1}, ${element.height + 1});`;
        case "line":
            return `${func}(canvas, ${element.x}, ${element.y}, ${element.x2}, ${element.y2});`;
        case "circle":
        case "disc":
            return `${func}(canvas, ${element.x + element.radius}, ${element.y + element.radius}, ${element.radius});`;
        case "str":
            return `canvas_set_font(canvas, ${font});
${func}(canvas, ${element.x}, ${element.y}, "${element.text}")`;
    }
};

function generateCode(screenElements, isInverted, library, context) {
    if (library === "uint32") {
        return getUint32Code(context);
    }
    let lines = "";
    const declaredIcons = [];
    if (isInverted) {
        lines = invertedHeaders[library];
    }
    for (let i = 0; i < screenElements.length; i++) {
        const element = screenElements[i];
        // avoid duplicate icon declarations
        const isDeclared = declaredIcons.indexOf(element.name) >= 0;
        if (!isDeclared) {
            declaredIcons.push(element.name);
        }
        lines = `${lines}${codeGenerators[library](element, isDeclared, context)}
`;
    }
    return lines;
};

function getTextWidth(text, font) {
    return textCharWidth[font] * text.length;
}

