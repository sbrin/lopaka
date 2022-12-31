function bline(imgData, x0, y0, x1, y1) {
    const resultArr = [];
    const dx = Math.abs(x1 - x0),
        sx = x0 < x1 ? 1 : -1;
    const dy = Math.abs(y1 - y0),
        sy = y0 < y1 ? 1 : -1;
    let err = (dx > dy ? dx : -dy) / 2;
    while (true) {
        resultArr.push([x0, y0]);
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

function maskBlack(imgData) {
    for (var i = 0; i < imgData.data.length; i += 4) {
        if (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2] >= 10) {
            imgData.data[i + 3] = 0; // alpha
        }
    }
    return imgData;
}

function readFileAsync(file) {
    console.log("start async reading");
    return new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onload = () => {
            console.log("finish async reading");
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
            console.log(element);
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
        case "str":
            return `canvas_set_font(canvas, ${element.font});
${func}(canvas, ${element.x}, ${element.y}, "${element.text}")`;
    }
};

function generateCode(uiArr) {
    let lines = "";
    const declaredIcons = [];
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

function getLayerListItem(element) {
    if (element.type === "str") {
        return `${element.text || "Empty str"}`;
    }
    if (element.type === "icon") {
        return `${element.name}`;
    }
    return `${element.type}`;
};