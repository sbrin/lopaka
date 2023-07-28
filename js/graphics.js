function drawLine(imageData, x1, y1, x2, y2, canvasWidth, canvasHeight, erase) {
    let pixels = new Uint32Array(imageData.data.buffer);
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = (x1 < x2) ? 1 : -1;
    let sy = (y1 < y2) ? 1 : -1;
    let err = dx - dy;
    while (true) {
        let index = (y1 * canvasWidth + x1);
        if (x1 >= 0 && x1 < canvasWidth && y1 >= 0 && y1 < canvasHeight) {
            pixels[index] = erase ? null : 0xFF000000; // Black pixel
        }

        if ((x1 === x2) && (y1 === y2)) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x1 += sx; }
        if (e2 < dx) { err += dx; y1 += sy; }
    }
    return imageData;
}

function drawCircle(
    imgData,
    centerX,
    centerY,
    radius,
    canvasWidth,
    canvasHeight
) {
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

function drawDisc(
    imgData,
    centerX,
    centerY,
    radius,
    canvasWidth,
    canvasHeight
) {
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

function imgToCanvasData(imgElement) {
    // Create a new canvas element
    var canvas = document.createElement("canvas");
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;

    // Get the 2D drawing context of the canvas
    var ctx = canvas.getContext("2d");

    // Draw the image onto the canvas
    ctx.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height);

    // Get the imageData array from the canvas
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    return imageData;
}

function maskAndMixImageData(originalImageData, newImageData, dx, dy) {
    let resultImageData = new ImageData(
        new Uint8ClampedArray(originalImageData.data.buffer.slice(0)),
        originalImageData.width,
        originalImageData.height
    );

    for (let y = 0; y < originalImageData.height; y++) {
        for (let x = 0; x < originalImageData.width; x++) {
            let newPos = (y * originalImageData.width + x) * 4;
            let oldPos = ((y - dy) * newImageData.width + (x - dx)) * 4;

            if (x - dx >= 0 && x - dx < newImageData.width && y - dy >= 0 && y - dy < newImageData.height) {
                // Masking operation
                if (
                    newImageData.data[oldPos + 3] <= 127 ||
                    newImageData.data[oldPos] + newImageData.data[oldPos + 1] + newImageData.data[oldPos + 2] >= 381
                ) {
                    // Lighter colors, make them transparent
                    resultImageData.data[newPos] = originalImageData.data[newPos]; // R
                    resultImageData.data[newPos + 1] = originalImageData.data[newPos + 1]; // G
                    resultImageData.data[newPos + 2] = originalImageData.data[newPos + 2]; // B
                    resultImageData.data[newPos + 3] = originalImageData.data[newPos + 3]; // alpha
                } else {
                    // Darker colors, make them black
                    resultImageData.data[newPos] = 0; // R
                    resultImageData.data[newPos + 1] = 0; // G
                    resultImageData.data[newPos + 2] = 0; // B
                    resultImageData.data[newPos + 3] = 255; // alpha
                }
            }
        }
    }

    return resultImageData;
}

function putImageDataWithAlpha(ctx, newImageData, dx, dy, alpha) {
    var oldImageData = ctx.getImageData(
        dx,
        dy,
        newImageData.width,
        newImageData.height
    );
    var oldData = oldImageData.data;
    var newData = newImageData.data;

    for (var i = 0; i < newData.length; i += 4) {
        if (newData[i + 3] > 0) {
            const R = newData[i];
            const G = newData[i + 1];
            const B = newData[i + 2];
            const A = newData[i + 3];
            oldData[i] = R;
            oldData[i + 1] = G;
            oldData[i + 2] = B;
            oldData[i + 3] = alpha * A; // Alpha
        }
    }

    ctx.putImageData(oldImageData, dx, dy);
}

function addImageDataPadding(imageData, shiftX, shiftY, frameWidth, frameHeight) {
    const childWidth = imageData.width;
    const childHeight = imageData.height;
    let newWidth = childWidth;
    let newHeight = childHeight;

    const offsetX = shiftX > 0 ? Math.abs(shiftX) : 0;
    const offsetY = shiftY > 0 ? Math.abs(shiftY) : 0;

    if (childWidth - Math.abs(shiftX) < frameWidth || shiftX > 0) {
        newWidth = childWidth + Math.abs(shiftX);
    }
    if (childHeight - Math.abs(shiftY) < frameHeight || shiftY > 0) {
        newHeight = childHeight + Math.abs(shiftY);
    }

    const newData = new Uint8ClampedArray(newWidth * newHeight * 4);

    for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
            const position = (y * imageData.width + x) * 4;
            const newPosition = ((y + offsetY) * newWidth + (x + offsetX)) * 4;
            newData.set(imageData.data.slice(position, position + 4), newPosition);
        }
    }
    return new ImageData(newData, newWidth, newHeight);
}

function startDrawing(isDrawingCurrent, layerProps, currentLayer, canvasWidth, canvasHeight, oX, oY, isEraser) {
    if (isDrawingCurrent) {
        layerProps = {
            ...currentLayer,
            imageData: addImageDataPadding(currentLayer.imageData, currentLayer.x, currentLayer.y, canvasWidth, canvasHeight),
            x: currentLayer.x > 0 ? 0 : currentLayer.x,
            y: currentLayer.y > 0 ? 0 : currentLayer.y,
            width: currentLayer.imageData.width,
            height: currentLayer.imageData.height,
        }
    } else {
        layerProps.x = 0;
        layerProps.y = 0;
        const imageDataArraylength = 4 * canvasWidth * canvasHeight;
        layerProps.imageData = new ImageData(
            new Uint8ClampedArray(imageDataArraylength),
            canvasWidth,
            canvasHeight,
        );
        layerProps.width = layerProps.imageData.width;
        layerProps.height = layerProps.imageData.height;
    }
    drawLine(layerProps.imageData,
        oX - layerProps.x,
        oY - layerProps.y,
        oX - layerProps.x,
        oY - layerProps.y,
        layerProps.imageData.width,
        layerProps.imageData.height,
        isEraser,
    );
    return layerProps;
}