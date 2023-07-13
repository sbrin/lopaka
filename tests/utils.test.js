const { bline, drawCircle, drawDisc, maskBlack } = require('../js/utils.js');

// Mocking the ImageData object
function createMockImageData(width, height) {
  return {
+    width,
+    height,
+    data: new Uint8ClampedArray(width * height * 4)
+  };
+}
+
+describe('bline function', () => {
+  let mockImageData;
+  beforeEach(() => {
+    mockImageData = createMockImageData(10, 10);
+  });
+
+  it('should draw a line from (0,0) to (9,9)', () => {
+    bline(mockImageData, 0, 0, 9, 9, [255, 255, 255, 255]);
+    // Assert that the pixels from (0,0) to (9,9) have been colored white
+    for (let i = 0; i < 10; i++) {
+      const pixelIndex = (i * 10 + i) * 4;
+      expect(mockImageData.data.slice(pixelIndex, pixelIndex + 4)).toEqual([255, 255, 255, 255]);
+    }
+  });
+
+  it('should draw a line from (9,0) to (0,9)', () => {
+    bline(mockImageData, 9, 0, 0, 9, [255, 255, 255, 255]);
+    // Assert that the pixels from (9,0) to (0,9) have been colored white
+    for (let i = 0; i < 10; i++) {
+      const pixelIndex = (i * 10 + (9 - i)) * 4;
+      expect(mockImageData.data.slice(pixelIndex, pixelIndex + 4)).toEqual([255, 255, 255, 255]);
+    }
+  });
+});
+
+describe('drawCircle function', () => {
+  // Write your tests here
+});
+
+describe('drawDisc function', () => {
+  // Write your tests here
+});
+
+describe('maskBlack function', () => {
+  let mockImageData;
+  beforeEach(() => {
+    mockImageData = createMockImageData(10, 10);
+  });
+
+  it('should turn all black pixels to transparent', () => {
+    // Fill the mock image data with black pixels
+    for (let i = 0; i < mockImageData.data.length; i += 4) {
+      mockImageData.data.set([0, 0, 0, 255], i);
+    }
+
+    maskBlack(mockImageData);
+
+    // Assert that all pixels have been turned transparent
+    for (let i = 0; i < mockImageData.data.length; i += 4) {
+      expect(mockImageData.data.slice(i, i + 4)).toEqual([0, 0, 0, 0]);
+    }
+  });
+
+  it('should not affect non-black pixels', () => {
+    // Fill the mock image data with white pixels
+    for (let i = 0; i < mockImageData.data.length; i += 4) {
+      mockImageData.data.set([255, 255, 255, 255], i);
+    }
+
+    maskBlack(mockImageData);
+
+    // Assert that all pixels are still white
+    for (let i = 0; i < mockImageData.data.length; i += 4) {
+      expect(mockImageData.data.slice(i, i + 4)).toEqual([255, 255, 255, 255]);
+    }
+  });
+});
