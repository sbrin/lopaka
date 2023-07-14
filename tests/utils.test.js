
// Test for getTextWidth function

describe('getTextWidth', () => {
  it('should return the correct width of the text string in the specified font', () => {
    expect(getTextWidth('Hello', 'font1')).toBe(50);
    expect(getTextWidth('Hello', 'font2')).toBe(100);
    expect(getTextWidth('Hello World', 'font1')).toBe(110);
    expect(getTextWidth('Hello World', 'font2')).toBe(220);
  });
});
