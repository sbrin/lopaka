import {describe, expect, it} from 'vitest';
import {MicropythonParser} from './micropython.parser';
import {MicropythonPlatform} from '../micropython';
import {layersMock} from '../layers.mock';

const drawingCode = (name: string) => String.raw`
image_bits = bytearray(b'\xff')
fb_image = framebuf.FrameBuffer(image_bits, 8, 1, framebuf.MONO_HLSB)
def draw():
    ${name}.line(1, 2, 3, 4, 1)
    ${name}.rect(5, 6, 7, 8, 1)
    ${name}.fill_rect(9, 10, 11, 12, 0)
    ${name}.ellipse(20, 21, 3, 4, 1, True)
    ${name}.text("Hello", 2, 3, 1)
    ${name}.blit(fb_image, 10, 11)
    ${name}.show()
`;

describe('MicroPython display aliases', () => {
    it.each(['display', 'myDisplay', 'oled_1', '_screen'])('imports all drawing primitives from %s', (name) => {
        const parser = new MicropythonParser();
        const result = parser.importSourceCode(drawingCode(name));
        expect(result.warnings).toEqual([]);
        expect(result.states.map((state) => state.type)).toEqual(['line', 'rect', 'rect', 'ellipse', 'string', 'paint']);
        expect(result.states[0].p1).toMatchObject({x: 1, y: 2});
        expect(result.states[2]).toMatchObject({fill: true, color: '#000000'});
        expect(result.states[4].text).toBe('Hello');
        expect(result.states[5]).toMatchObject({position: {x: 10, y: 11}, size: {x: 8, y: 1}});
        expect(result).toEqual(parser.importSourceCode(drawingCode('display')));
    });

    it('does not import calls embedded in text or comments', () => {
        const result = new MicropythonParser().importSourceCode(`
# myDisplay.rect(1, 2, 3, 4, 1)
myDisplay.text("other.rect(1, 2, 3, 4, 1)", 2, 3, 1)
myDisplay.show()
`);
        expect(result.warnings).toEqual([]);
        expect(result.states).toHaveLength(1);
        expect(result.states[0].text).toBe('other.rect(1, 2, 3, 4, 1)');
    });

    it.each([true, false])('reimports generated code with wrap=%s and a custom alias', (wrap) => {
        const platform = new MicropythonPlatform();
        platform.setTemplateSetting('wrap', wrap);
        const original = platform.generateSourceCode([...layersMock]);
        const expected = new MicropythonParser().importSourceCode(original);
        expect(expected.states.length).toBeGreaterThan(0);
        expect(platform.setDisplayObjectName('myDisplay')).toBe(true);
        const custom = platform.generateSourceCode([...layersMock]);
        expect(custom).toContain('myDisplay.');
        // Check both the intermediate source-map markers and the code copied from the panel.
        const parser = new MicropythonParser();
        expect(parser.importSourceCode(custom)).toEqual(expected);
        expect(parser.importSourceCode(platform.sourceMapParser.parse(custom).code)).toEqual(expected);
    });
});
