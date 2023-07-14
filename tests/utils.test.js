const { bline, drawCircle, drawDisc, maskBlack, getTextWidth, getElementByOffset, imgDataToUint32Array, getUint32Code, getU8g2Code, getFlipperCode, generateCode } = require('../js/utils.js');

// Mocking the ImageData object
function createMockImageData(width, height) {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4)
  };
}

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
    const mockData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4)
    };

    const expectedCode = 'some expected code';

    expect(generateCode(mockData)).toBe(expectedCode);
  });
});
