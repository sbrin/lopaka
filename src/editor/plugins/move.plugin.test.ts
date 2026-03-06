import {describe, expect, it, vi} from 'vitest';
import {Keys} from '../../core/keys.enum';
import {MovePlugin} from './move.plugin';

type NumericModifier = {
    getValue: () => number;
    setValue: (value: number) => void;
};

// Create a numeric modifier with mutable in-memory storage.
const createNumericModifier = (initialValue: number): NumericModifier => {
    let value = initialValue;
    return {
        // Return the current numeric value for the modifier.
        getValue: () => value,
        // Persist the updated numeric value for the modifier.
        setValue: (nextValue: number) => {
            value = nextValue;
        },
    };
};

describe('MovePlugin keyboard movement', () => {
    it('moves all three triangle vertices on arrow keys', () => {
        // Build a triangle-like layer exposing three vertex modifier pairs.
        const layer = {
            modifiers: {
                x1: createNumericModifier(10),
                y1: createNumericModifier(20),
                x2: createNumericModifier(30),
                y2: createNumericModifier(40),
                x3: createNumericModifier(50),
                y3: createNumericModifier(60),
            },
        };

        // Provide the minimal session shape consumed by MovePlugin key handling.
        const session = {
            layersManager: {
                selected: [layer],
            },
            virtualScreen: {
                redraw: vi.fn(),
            },
        };

        // Initialize the plugin instance for keyboard movement testing.
        const plugin = new MovePlugin(session as any, document.createElement('div'));

        // Move right by one pixel and verify all x-coordinates were shifted.
        plugin.onKeyDown(Keys.ArrowRight, new KeyboardEvent('keydown'));
        expect(layer.modifiers.x1.getValue()).toBe(11);
        expect(layer.modifiers.x2.getValue()).toBe(31);
        expect(layer.modifiers.x3.getValue()).toBe(51);

        // Move down with Shift and verify all y-coordinates were shifted by 10.
        plugin.onKeyDown(Keys.ArrowDown, new KeyboardEvent('keydown', {shiftKey: true}));
        expect(layer.modifiers.y1.getValue()).toBe(30);
        expect(layer.modifiers.y2.getValue()).toBe(50);
        expect(layer.modifiers.y3.getValue()).toBe(70);

        // Ensure redraw is requested after each keyboard movement.
        expect(session.virtualScreen.redraw).toHaveBeenCalledTimes(2);
    });
});
