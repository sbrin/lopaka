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
    const scaledY2 = scaleUp(
      element.yy ? element.yy + element.height : element.y + element.height
    );
    // if (element.type === "pen") {
    //   return element;
    // } else
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
    } else if (
      scaledX1 <= x &&
      scaledX2 >= x &&
      scaledY1 <= y &&
      scaledY2 >= y
    ) {
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
  });
}

function imgDataToXBMP(imgData, xStart, yStart, width, height) {
  const bytesPerRow = Math.ceil(width / 8);
  const xbmp = new Array(height * bytesPerRow).fill(0);

  for (let y = yStart; y < yStart + height; y++) {
    for (let x = xStart; x < xStart + width; x++) {
      const imgDataIndex = (y * width + x) * 4;
      const alphaValue = imgData.data[imgDataIndex + 3];

      if (alphaValue > 127) {
        const xbmpIndex =
          (y - yStart) * bytesPerRow + Math.floor((x - xStart) / 8);
        const bitPosition = (x - xStart) % 8;
        xbmp[xbmpIndex] |= 1 << bitPosition;
      }
    }
  }

  return xbmp.map((x) => "0x" + x.toString(16).padStart(2, "0"));
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
        xbmp[xbmpIndex] >>>= 0; // Convert to unsigned integer
      }
    }
  }

  return xbmp.map((x) => "0x" + x.toString(16));
}

function getUint32Code(context) {
  let result = ``;
  const imgData = context.getImageData(
    0,
    0,
    context.canvas.width,
    context.canvas.height
  );
  const UINT32 = imgDataToUint32Array(imgData);

  const iconName = `image_frame`;
  result += `const uint32_t ${iconName}[] = {${UINT32}};
`;
  return result;
}

function getU8g2Code(element) {
  const type = element.type.charAt(0).toUpperCase() + element.type.slice(1);
  const func = `u8g2.draw${type}`;
  const { width, height, x, y } = element;
  const font = fontMap["u8g2"][element.font];
  switch (element.type) {
    case "icon":
      let result = ``;
      const iconName = `icon_${element.name}_bits`;
      result += `u8g2.drawXBMP( ${x}, ${y}, ${width}, ${height}, ${iconName});`;
      return result;
    case "box":
      return `${func}(${element.x}, ${element.y}, ${element.width}, ${element.height});`;
    case "dot":
      return `u8g2.drawPixel(${element.x}, ${element.y});`;
    case "frame":
      return `${func}(${element.x}, ${element.y}, ${element.width + 1}, ${element.height + 1
        });`;
    case "line":
      return `${func}(${element.x}, ${element.y}, ${element.x2}, ${element.y2});`;
    case "circle":
    case "disc":
      return `${func}(${element.x + element.radius}, ${element.y + element.radius
        }, ${element.radius});`;
    case "str":
      return `u8g2.setFont(${font});
${func}(${element.x}, ${element.y}, "${element.text}");`;
  }
}

function getU8g2Declarations(element, context) {
  const { width, height, x, y } = element;
  let result = ``;
  const imgData = context.getImageData(x, y, width, height);
  const XBMP = imgDataToXBMP(imgData, 0, 0, width, height);
  const iconName = `icon_${element.name}_bits`;
  result += `static const unsigned char ${iconName}[] U8X8_PROGMEM = {${XBMP}};
`;
  return result;
}

function getFlipperDeclarations(element) {
  if (element.isCustom) {
    return `extern const Icon I_${element.name};\n`;
  }
  return "";
}

function getFlipperCode(element) {
  const func = `canvas_draw_${element.type}`;
  const font = fontMap["flipper"][element.font];
  switch (element.type) {
    case "icon":
      return `${func}(canvas, ${element.x}, ${element.y}, &I_${element.name});`;
    case "box":
      return `${func}(canvas, ${element.x}, ${element.y}, ${element.width}, ${element.height});`;
    case "dot":
      return `${func}(canvas, ${element.x}, ${element.y});`;
    case "frame":
      return `${func}(canvas, ${element.x}, ${element.y}, ${element.width + 1
        }, ${element.height + 1});`;
    case "line":
      return `${func}(canvas, ${element.x}, ${element.y}, ${element.x2}, ${element.y2});`;
    case "circle":
    case "disc":
      return `${func}(canvas, ${element.x + element.radius}, ${element.y + element.radius
        }, ${element.radius});`;
    case "str":
      return `canvas_set_font(canvas, ${font});
${func}(canvas, ${element.x}, ${element.y}, "${element.text}");`;
  }
}

function generateCode(screenElements, library, context) {
  const codeGenerators = {
    flipper: getFlipperCode,
    u8g2: getU8g2Code,
    uint32: getUint32Code,
  };

  if (library === "uint32") {
    return getUint32Code(context);
  }
  let lines = "";
  let declarations = "";
  const declaredIcons = [];
  for (let i = 0; i < screenElements.length; i++) {
    const element = screenElements[i];
    if (element.isOverlay) {
      continue;
    }
    if (element.type === "icon" && !!codeDeclarators[library]) {
      // avoid duplicate icon declarations
      const isDeclared = declaredIcons.indexOf(element.name) >= 0;
      if (!isDeclared) {
        declaredIcons.push(element.name);
        declarations = `${declarations}${codeDeclarators[library](
          element,
          context
        )}`;
      }
    }
    lines = `${lines}${codeGenerators[library](element, context)}
`;
  }
  return `${declarations}${lines}`;
}

function getTextWidth(text, font) {
  return textCharWidth[font] * text.length;
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
          newImageData.data[oldPos + 3] < 127 ||
          newImageData.data[oldPos] + newImageData.data[oldPos + 1] + newImageData.data[oldPos + 2] > 381
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


function toCppVariableName(str) {
  var cppKeywords = [
    "auto",
    "double",
    "int",
    "struct",
    "break",
    "else",
    "long",
    "switch",
    "case",
    "enum",
    "register",
    "typedef",
    "char",
    "extern",
    "return",
    "union",
    "const",
    "float",
    "short",
    "unsigned",
    "continue",
    "for",
    "signed",
    "void",
    "default",
    "goto",
    "sizeof",
    "volatile",
    "do",
    "if",
    "static",
    "while",
  ];

  // Replace non-alphanumeric characters with underscores
  var variableName = str.replace(/[^a-z0-9]/gi, "_");

  // Prepend an underscore if the first character is a digit
  if (/[0-9]/.test(variableName[0])) {
    variableName = "_" + variableName;
  }

  // If name is a C++ keyword, append an underscore
  if (cppKeywords.includes(variableName)) {
    variableName += "_";
  }

  return variableName;
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
    const R = newData[i];
    const G = newData[i + 1];
    const B = newData[i + 2];
    const A = newData[i + 3];
    oldData[i] = R;
    oldData[i + 1] = G;
    oldData[i + 2] = B;
    oldData[i + 3] = alpha * A; // Alpha
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
  // сюда не попадает потому что childHeight уже выросла сильно больше
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



