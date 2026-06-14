import {beforeEach, describe, expect, it, vi} from 'vitest';
import {alignMultipleLayers} from './alignLayers';

const createModifier = (initial: number) => {
    let value = initial;
    const setValue = vi.fn((next: number) => {
        value = next;
    });
    return {
        getValue: () => value,
        setValue,
    };
};

const createLayer = (x: number, y: number) => {
    const xModifier = createModifier(x);
    const yModifier = createModifier(y);
    return {
        bounds: {
            size: {x: 10, y: 10},
        },
        modifiers: {
            x: xModifier,
            y: yModifier,
        },
        pushHistory: vi.fn(),
        pushRedoHistory: vi.fn(),
        getType: () => 'rect',
    } as any;
};

const createTextLayer = (x: number, y: number, width: number, height: number) => {
    const xModifier = createModifier(x);
    const yModifier = createModifier(y);
    return {
        bounds: {
            size: {x: width, y: height},
        },
        modifiers: {
            x: xModifier,
            y: yModifier,
        },
        pushHistory: vi.fn(),
        pushRedoHistory: vi.fn(),
        getType: () => 'string',
    } as any;
};

const createPointLayer = (x1: number, y1: number, x2: number, y2: number, type = 'rect') => {
    const x1Modifier = createModifier(x1);
    const x2Modifier = createModifier(x2);
    const y1Modifier = createModifier(y1);
    const y2Modifier = createModifier(y2);
    return {
        bounds: {
            size: {x: Math.abs(x2 - x1), y: Math.abs(y2 - y1)},
        },
        modifiers: {
            x1: x1Modifier,
            x2: x2Modifier,
            y1: y1Modifier,
            y2: y2Modifier,
        },
        pushHistory: vi.fn(),
        pushRedoHistory: vi.fn(),
        getType: () => type,
    } as any;
};

describe('alignMultipleLayers', () => {
    let history: {batchStart: ReturnType<typeof vi.fn>; batchEnd: ReturnType<typeof vi.fn>};
    let virtualScreen: {redraw: ReturnType<typeof vi.fn>};
    let session: any;

    beforeEach(() => {
        history = {
            batchStart: vi.fn(),
            batchEnd: vi.fn(),
        };
        virtualScreen = {redraw: vi.fn()};
        session = {
            history,
            virtualScreen,
            layersManager: {
                selected: [],
            },
        };
    });

    it('wraps multi-layer alignment in a history batch', () => {
        const layerA = createLayer(0, 0);
        const layerB = createLayer(20, 0);
        session.layersManager.selected = [layerA, layerB];

        alignMultipleLayers('align_left', session);

        expect(history.batchStart).toHaveBeenCalledTimes(1);
        expect(history.batchEnd).toHaveBeenCalledTimes(1);
        expect(layerA.modifiers.x.setValue).toHaveBeenCalledWith(0);
        expect(layerB.modifiers.x.setValue).toHaveBeenCalledWith(0);
        expect(virtualScreen.redraw).toHaveBeenCalledTimes(1);
    });

    it('skips batching when only a single layer is selected', () => {
        const layer = createLayer(5, 5);
        session.layersManager.selected = [layer];

        alignMultipleLayers('align_left', session);

        expect(history.batchStart).not.toHaveBeenCalled();
        expect(history.batchEnd).not.toHaveBeenCalled();
        expect(virtualScreen.redraw).not.toHaveBeenCalled();
        expect(layer.modifiers.x.setValue).not.toHaveBeenCalled();
    });

    it('keeps reversed x1/x2 ordering when aligning point-based layers to the right edge', () => {
        const anchor = createLayer(40, 0);
        const reversedLine = createPointLayer(28, 4, 20, 4);
        session.layersManager.selected = [anchor, reversedLine];

        alignMultipleLayers('align_right', session);

        expect(reversedLine.modifiers.x1.setValue).toHaveBeenCalledWith(50);
        expect(reversedLine.modifiers.x2.setValue).toHaveBeenCalledWith(42);
        expect(virtualScreen.redraw).toHaveBeenCalledTimes(1);
    });

    it('aligns text layers to the shared bottom baseline', () => {
        const rectangle = createLayer(0, 0);
        const text = createTextLayer(15, 4, 10, 14);
        session.layersManager.selected = [rectangle, text];

        alignMultipleLayers('align_bottom', session);

        expect(text.modifiers.y.setValue).toHaveBeenCalledWith(10);
        expect(virtualScreen.redraw).toHaveBeenCalledTimes(1);
    });
});
