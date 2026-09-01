import {ref, watch, type ComputedRef, type Ref} from 'vue';
import type {Display} from '/src/core/displays';
import type {Point} from '/src/core/point';

export type TDisplaySelection = number | 'custom';

type DisplaySelectionOptions = {
    display: Ref<Point>;
    isDisplayCustom: Ref<boolean>;
    platform: Ref<string>;
    displays: ComputedRef<Display[]>;
};

export function useDisplaySelection({display, isDisplayCustom, platform, displays}: DisplaySelectionOptions) {
    function getCurrentDisplaySelection(): TDisplaySelection {
        if (isDisplayCustom.value) {
            return 'custom';
        }

        const index = displays.value.findIndex((item) => item.size.equals(display.value));
        return index >= 0 ? index : 'custom';
    }

    const selectedDisplay = ref<TDisplaySelection>(getCurrentDisplaySelection());
    const lastDisplay = ref<TDisplaySelection>(selectedDisplay.value);

    watch([platform, () => display.value.x, () => display.value.y, isDisplayCustom], () => {
        const nextSelection = getCurrentDisplaySelection();
        selectedDisplay.value = nextSelection;
        if (nextSelection !== 'custom') {
            lastDisplay.value = nextSelection;
        }
    });

    return {selectedDisplay, lastDisplay};
}
