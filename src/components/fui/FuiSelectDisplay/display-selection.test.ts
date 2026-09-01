import {computed, nextTick, ref} from 'vue';
import {describe, expect, it} from 'vitest';
import {Point} from '/src/core/point';
import {useDisplaySelection} from './display-selection';

describe('useDisplaySelection', () => {
    const displays = [
        {title: '128×64', size: new Point(128, 64)},
        {title: '200×200', size: new Point(200, 200)},
    ];

    it('tracks an externally changed preset', async () => {
        const display = ref(new Point(128, 64));
        const isDisplayCustom = ref(false);
        const platform = ref('u8g2');
        const selection = useDisplaySelection({
            display,
            isDisplayCustom,
            platform,
            displays: computed(() => displays),
        });

        expect(selection.selectedDisplay.value).toBe(0);

        display.value = new Point(200, 200);
        await nextTick();

        expect(selection.selectedDisplay.value).toBe(1);
        expect(selection.lastDisplay.value).toBe(1);
    });

    it('shows custom while preserving the last preset for reset', async () => {
        const display = ref(new Point(128, 64));
        const isDisplayCustom = ref(false);
        const platform = ref('u8g2');
        const selection = useDisplaySelection({
            display,
            isDisplayCustom,
            platform,
            displays: computed(() => displays),
        });

        display.value = new Point(201, 201);
        isDisplayCustom.value = true;
        await nextTick();

        expect(selection.selectedDisplay.value).toBe('custom');
        expect(selection.lastDisplay.value).toBe(0);
    });
});
