<script
    lang="ts"
    setup
>
import { computed, onMounted, toRefs, watch } from 'vue';
import { useSession } from '/src/core/session';
import { PaintLayer } from '/src/core/layers/paint.layer';

const session = useSession();
const { platform } = toRefs(session.state);
const { activeTool } = toRefs(session.editor.state);
const { activeLayer } = toRefs(session.editor.state);

const activePaintLayer = computed(() =>
    activeLayer.value instanceof PaintLayer ? activeLayer.value : null
);

const platformFeatures = computed(() => session.getPlatformFeatures(platform.value));

const paintColorMode = computed<'rgb' | 'monochrome'>({
    get: () => session.state.paintColorMode,
    set: (value) => session.setPaintColorMode(value),
});

function getCurrentBrushColor(): string {
    return (
        activePaintLayer.value?.color ||
        session.editor.lastColor ||
        session.state.brushColor ||
        platformFeatures.value?.defaultColor ||
        '#ffffff'
    );
}

watch(
    () => session.state.paintColorMode,
    (mode) => {
        if (activeTool.value?.getName() !== 'paint') {
            return;
        }
        const layer = activePaintLayer.value;
        if (layer) {
            const newColor = getCurrentBrushColor();
            layer.setColorMode(mode, newColor);
            session.virtualScreen.redraw();
            // Refresh inspector fields after color mode changes.
            session.layersManager.requestUpdate();
        }
    }
);

watch(
    () => session.state.brushColor,
    (color) => {
        if (activeTool.value?.getName() !== 'paint' || session.state.paintColorMode !== 'monochrome') {
            return;
        }
        const layer = activePaintLayer.value;
        if (layer) {
            layer.setColorMode('monochrome', color);
            session.virtualScreen.redraw();
        }
    }
);

onMounted(() => {
    const layer = activePaintLayer.value;
    if (layer) {
        paintColorMode.value = layer.colorMode as 'rgb' | 'monochrome';
    }
});
</script>
<template>
    <div class="ml-2">
        <label
            class="cursor-pointer flex items-center gap-2"
            @mousedown.prevent="() => { }"
            tabindex="-1"
        >
            <span
                class="label-text"
                :class="{ 'text-gray-500': paintColorMode === 'rgb' }"
            >
                Mono
            </span>
            <input
                type="checkbox"
                class="toggle toggle-xs toggle-primary"
                v-model="paintColorMode"
                true-value="rgb"
                false-value="monochrome"
                tabindex="-1"
                @mousedown.prevent="() => { }"
            />
            <span
                class="label-text"
                :class="{ 'text-gray-500': paintColorMode === 'monochrome' }"
            >
                RGB
            </span>
        </label>
    </div>
</template>
