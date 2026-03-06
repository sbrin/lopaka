import {afterEach, describe, expect, it, vi} from 'vitest';
import {PaintLayer} from './paint.layer';
import {TPlatformFeatures} from '../../platforms/platform';

const features: TPlatformFeatures = {
    hasCustomFontSize: true,
    hasInvertedColors: false,
    hasRGBSupport: true,
    defaultColor: '#000000',
    interfaceColors: {
        selectColor: '#fff',
        resizeIconColor: '#fff',
        hoverColor: '#fff',
        rulerColor: '#fff',
        rulerLineColor: '#fff',
        selectionStrokeColor: '#fff',
    },
};

describe('PaintLayer image import', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('uses intrinsic image dimensions when metadata is missing', () => {
        const originalCreateElement = document.createElement.bind(document);
        const getImageData = vi.fn((x: number, y: number, width: number, height: number) => {
            if (!width || !height) {
                throw new DOMException('The source width is 0.', 'IndexSizeError');
            }

            return new ImageData(width, height);
        });

        vi.spyOn(document, 'createElement').mockImplementation((...args: Parameters<typeof document.createElement>) => {
            if (args[0] === 'canvas') {
                return {
                    width: 0,
                    height: 0,
                    getContext: () => ({
                        drawImage: vi.fn(),
                        getImageData,
                    }),
                } as unknown as HTMLCanvasElement;
            }

            return originalCreateElement(...args);
        });

        const layer = new PaintLayer(features, undefined, 'rgb');
        const image = document.createElement('img');

        Object.defineProperty(image, 'naturalWidth', {value: 64});
        Object.defineProperty(image, 'naturalHeight', {value: 64});

        expect(() => layer.modifiers.icon.setValue(image)).not.toThrow();
        expect(layer.size.x).toBe(64);
        expect(layer.size.y).toBe(64);
        expect(layer.colorMode).toBe('rgb');
        expect(getImageData).toHaveBeenCalledWith(0, 0, 64, 64);
    });
});
