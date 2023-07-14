const { bline, drawCircle, drawDisc, maskBlack, getTextWidth, getElementByOffset, imgDataToUint32Array, getUint32Code, getU8g2Code, getFlipperCode, generateCode } = require('../js/utils.js');

// Mocking the ImageData object
function createMockImageData(width, height) {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4)
  };
}

describe('bline function', () => {
  let mockImageData;
  beforeEach(() => {
    mockImageData = createMockImageData(10, 10);
  });

  it('should draw a line from (0,0) to (9,9)', () => {
    bline(mockImageData, 0, 0, 9, 9, [255, 255, 255, 255]);
    // Assert that the pixels from (0,0) to (9,9) have been colored white
    for (let i = 0; i < 10; i++) {
      const pixelIndex = (i * 10 + i) * 4;
      expect(mockImageData.data.slice(pixelIndex, pixelIndex + 4)).toEqual([255, 255, 255, 255]);
    }
  });

  it('should draw a line from (9,0) to (0,9)', () => {
    bline(mockImageData, 9, 0, 0, 9, [255, 255, 255, 255]);
    // Assert that the pixels from (9,0) to (0,9) have been colored white
    for (let i = 0; i < 10; i++) {
      const pixelIndex = (i * 10 + (9 - i)) * 4;
      expect(mockImageData.data.slice(pixelIndex, pixelIndex + 4)).toEqual([255, 255, 255, 255]);
    }
  });
});

describe('drawCircle function', () => {
  let mockImageData;
  beforeEach(() => {
    mockImageData = createMockImageData(10, 10);
  });

  it('should draw a circle', () => {
    drawCircle(mockImageData, 5, 5, 5, [255, 255, 255, 255]);
    // Assert that the pixels within the circle have been colored white
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const pixelIndex = (y * 10 + x) * 4;
        const dx = x - 5;
        const dy = y - 5;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= 5) {
          expect(mockImageData.data.slice(pixelIndex, pixelIndex + 4)).toEqual([255, 255, 255, 255]);
        } else {
          expect(mockImageData.data.slice(pixelIndex, pixelIndex + 4)).toEqual([0, 0, 0, 0]);
        }
      }
    }
  });
});

describe('drawDisc function', () => {
  let mockImageData;
  beforeEach(() => {
    mockImageData = createMockImageData(10, 10);
  });

  it('should draw a filled disc', () => {
    drawDisc(mockImageData, 5, 5, 5, [255, 255, 255, 255]);
    // Assert that the pixels within the disc have been colored white
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const pixelIndex = (y * 10 + x) * 4;
        const dx = x - 5;
        const dy = y - 5;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= 5) {
          expect(mockImageData.data.slice(pixelIndex, pixelIndex + 4)).toEqual([255, 255, 255, 255]);
        } else {
          expect(mockImageData.data.slice(pixelIndex, pixelIndex + 4)).toEqual([0, 0, 0, 0]);
        }
      }
    }
  });
});

describe('maskBlack function', () => {
  let mockImageData;
  beforeEach(() => {
    mockImageData = createMockImageData(10, 10);
  });

  it('should turn all black pixels to transparent', () => {
    // Fill the mock image data with black pixels
    for (let i = 0; i < mockImageData.data.length; i += 4) {
      mockImageData.data.set([0, 0, 0, 255], i);
    }

    maskBlack(mockImageData);

    // Assert that all pixels have been turned transparent
    for (let i = 0; i < mockImageData.data.length; i += 4) {
      expect(mockImageData.data.slice(i, i + 4)).toEqual([0, 0, 0, 0]);
    }
  });

  it('should not affect non-black pixels', () => {
    // Fill the mock image data with white pixels
    for (let i = 0; i < mockImageData.data.length; i += 4) {
      mockImageData.data.set([255, 255, 255, 255], i);
    }

    maskBlack(mockImageData);

    // Assert that all pixels are still white
    for (let i = 0; i < mockImageData.data.length; i += 4) {
      expect(mockImageData.data.slice(i, i + 4)).toEqual([255, 255, 255, 255]);
    }
  });
});

describe('getTextWidth', () => {
  it('should return the correct width of the text string in the specified font', () => {
    expect(getTextWidth('Hello', 'font1')).toBe(50);
    expect(getTextWidth('Hello', 'font2')).toBe(100);
    expect(getTextWidth('Hello World', 'font1')).toBe(110);
    expect(getTextWidth('Hello World', 'font2')).toBe(220);
  });
});

describe('getElementByOffset', () => {
  it('should return the correct element by offset', () => {
    // Add your test implementation here
  });
});

describe('imgDataToUint32Array', () => {
  it('should correctly convert image data to Uint32Array', () => {
    // Add your test implementation here
  });
});

describe('getUint32Code', () => {
  it('should return the correct Uint32 code', () => {
    // Add your test implementation here
  });
});

describe('getU8g2Code', () => {
  it('should return the correct U8g2 code', () => {
    // Add your test implementation here
  });
});

describe('getFlipperCode', () => {
  it('should return the correct Flipper code', () => {
    // Add your test implementation here
  });
});

describe('generateCode', () => {
  it('should correctly generate code', () => {
    // Add your test implementation here
  });
});
