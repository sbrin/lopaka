function bline(imgData, x0, y0, x1, y1) {
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
        const n = (y * canvasWidth + x) * 4;

        imgData.data[n] = 0;
        imgData.data[n + 1] = 0;
        imgData.data[n + 2] = 0;
        imgData.data[n + 3] = 255;
    }
}

function drawCircle(imgData, centerX, centerY, radius) {
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

function drawDisc(imgData, centerX, centerY, radius) {
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

function maskBlack(CTX, isInverted) {
    const imgData = CTX.getImageData(
        0,
        0,
        canvasWidth,
        canvasHeight
    )
    for (var i = 0; i < imgData.data.length; i += 4) {
        // for (var i = 0; i < 1000; i += 4) {
        if (isInverted) {
            if (
                // If alpha is 0 
                imgData.data[i + 3] < 255 ||
                // Or if color is not black
                imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2] > 75
            ) {
                // Make it black
                imgData.data[i] = 0;
                imgData.data[i + 1] = 0;
                imgData.data[i + 2] = 0;
                imgData.data[i + 3] = 255; // alpha
            } else {
                imgData.data[i] = 0;
                imgData.data[i + 1] = 0;
                imgData.data[i + 2] = 0;
                imgData.data[i + 3] = 0;
            }
        } else {
            if (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2] >= 3) {
                imgData.data[i + 3] = 0; // alpha
            }
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

function getElementByOffset(uiArr, x, y) {
    for (let i = uiArr.length - 1; i >= 0; i--) {
        const element = uiArr[i];
        const scaledX1 = scaleUp(element.x);
        const scaledY1 = scaleUp(element.yy ? element.yy : element.y);
        const scaledX2 = scaleUp(element.x + element.width);
        const scaledY2 = scaleUp(element.yy ? element.yy + element.height : element.y + element.height);
        if (element.type === "line") {
            const isVertical = element.y === element.y2;
            const isHorisontal = element.y === element.y2;
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
        } else if (scaledX1 <= x && x < scaledX2 && scaledY1 <= y && y < scaledY2) {
            return element;
        }
    }
}
function loadImageAsync(src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    })
}

function getCode(element, isDeclared) {
    const func = `canvas_draw_${element.type}`;
    switch (element.type) {
        case "icon":
            let result = element.custom && !isDeclared ? `extern const Icon I_${element.name};\n` : ``;
            result += `${func}(canvas, ${element.x}, ${element.y}, &I_${element.name})`;
            return result;
        case "box":
            return `${func}(canvas, ${element.x}, ${element.y}, ${element.width}, ${element.height})`;
        case "dot":
            return `${func}(canvas, ${element.x}, ${element.y})`;
        case "frame":
            return `${func}(canvas, ${element.x}, ${element.y}, ${element.width + 1
                }, ${element.height + 1})`;
        case "line":
            return `${func}(canvas, ${element.x}, ${element.y}, ${element.x2}, ${element.y2})`;
        case "circle":
        case "disc":
            return `${func}(canvas, ${element.x + element.radius}, ${element.y + element.radius}, ${element.radius})`;
        case "str":
            return `canvas_set_font(canvas, ${element.font});
${func}(canvas, ${element.x}, ${element.y}, "${element.text}")`;
    }
};

function generateCode(uiArr, isInverted) {
    let lines = "";
    const declaredIcons = [];
    if (isInverted) {
        lines = `canvas_draw_box(canvas, 0, 0, 127, 63);
canvas_set_color(canvas, ColorWhite);

`;
    }
    for (let i = 0; i < uiArr.length; i++) {
        const element = uiArr[i];
        const isDeclared = declaredIcons.indexOf(element.name) >= 0;
        if (!isDeclared) {
            declaredIcons.push(element.name);
        }
        lines = `${lines}${getCode(element, isDeclared)};

`;
    }
    return lines;
};

function drawBigNumbers(imgData, x, y, text) {
    const charWidth = 12;
    const charHeight = 20;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const glyph = fontGlyphs[char];

        if (glyph) {
            for (let row = 0; row < charHeight; row++) {
                for (let col = 0; col < charWidth; col++) {
                    const glyphIndex = row * charWidth + col;
                    const imgDataIndex = ((y + row) * imgData.width + (x + col)) * 4;

                    if (glyph[glyphIndex] &&
                        x + col >= 0 && x + col < canvasWidth && y + row >= 0 && y + row < canvasHeight
                    ) {
                        imgData.data[imgDataIndex] = 0;     // R
                        imgData.data[imgDataIndex + 1] = 0; // G
                        imgData.data[imgDataIndex + 2] = 0; // B
                        imgData.data[imgDataIndex + 3] = 255; // A
                    }
                }
            }
            x += charWidth;
        }
    }
};

function getTextWidth(text, font) {
    return textCharWidth[font] * text.length;
}

