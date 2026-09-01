import {describe, expect, it, vi} from 'vitest';
import {exportOpaqueCanvasPng} from './webmcp-editor-tools';

describe('exportOpaqueCanvasPng', () => {
    it('composites editor pixels over the project background before encoding the PNG', () => {
        const source = {width: 128, height: 64} as HTMLCanvasElement;
        const context = {
            fillStyle: '',
            fillRect: vi.fn(),
            drawImage: vi.fn(),
        };
        const exportedCanvas = {
            width: 0,
            height: 0,
            getContext: vi.fn(() => context),
            toDataURL: vi.fn(() => 'data:image/png;base64,opaque'),
        } as unknown as HTMLCanvasElement;

        const result = exportOpaqueCanvasPng(source, '#123456', () => exportedCanvas);

        expect(result).toBe('data:image/png;base64,opaque');
        expect(exportedCanvas.width).toBe(128);
        expect(exportedCanvas.height).toBe(64);
        expect(context.fillStyle).toBe('#123456');
        expect(context.fillRect).toHaveBeenCalledWith(0, 0, 128, 64);
        expect(context.drawImage).toHaveBeenCalledWith(source, 0, 0);
        expect(exportedCanvas.toDataURL).toHaveBeenCalledWith('image/png');
    });
});
