import fs from 'fs';
import path from 'path';
import {beforeAll, describe, expect, it} from 'vitest';
import bdf2gfx from './bdf2gfx';

describe('bdf2gfx', () => {
    beforeAll(() => {
        File.prototype.text = function() {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsText(this);
            });
        };
    });

    function loadFixture(filename: string): File {
        const fixturePath = path.join(__dirname, '__fixtures__', filename);
        const content = fs.readFileSync(fixturePath, 'utf-8');
        return new File([content], filename, { type: 'text/plain' });
    }
    it('should convert any BDF to proper GFX', async () => {
        const inputFile = loadFixture('ncenR24.bdf');
        const result = await bdf2gfx(inputFile);
        const outputContent = await result.text();

        const expectedGFXFile = loadFixture('ncenR24.h');
        const expectedContent = await expectedGFXFile.text();
        expect(outputContent).toBe(expectedContent);
    });
});