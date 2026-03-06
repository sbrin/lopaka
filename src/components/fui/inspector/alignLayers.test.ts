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
});
