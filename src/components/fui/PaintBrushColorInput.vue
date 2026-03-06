<script
    lang="ts"
    setup
>
import { computed, onMounted, toRefs } from 'vue';
import { useSession } from '/src/core/session';
import Icon from '/src/components/layout/Icon.vue';

const session = useSession();
const { platform, brushColor } = toRefs(session.state);
const { activeLayer } = toRefs(session.editor.state);

const platformFeatures = computed(() => session.getPlatformFeatures(platform.value));

const brushPalette = computed(() => platformFeatures.value?.palette ?? []);

const normalizedBrushColor = computed(() => brushColor.value?.toLowerCase() ?? '');

function onBrushColorInput(event: Event) {
    const target = event.target as HTMLInputElement;
    selectColor(target.value);
}

function selectColor(color) {
    session.setBrushColor(color);
    session.setLastColor(color);
}

onMounted(() => {
    session.setBrushColor(
        activeLayer.value.modifiers.color
            ? activeLayer.value.color
            : (session.editor.lastColor ?? session.state.brushColor)
    );
});
</script>

<template>
    <div class="flex">
        <div
            v-if="brushPalette.length"
            class="brush-palette"
        >
            <button
                v-for="color in brushPalette"
                :key="color"
                type="button"
                class="brush-palette-box"
                :style="{ backgroundColor: color }"
                :class="{ selected: color.toLowerCase() === normalizedBrushColor }"
                @click="selectColor(color)"
                :aria-label="`Select brush color ${color}`"
            ></button>
        </div>
        <label
            v-else
            for="brush-color-input"
            class="relative rounded-lg w-6 h-6 cursor-pointer border border-secondary flex items-center justify-center "
            :style="`background-color: ${brushColor}`"
        >
            <div
                class="tooltip tooltip-bottom"
                data-tip="Paint color"
            >
                <!-- Keep the paint icon visible above the color swatch. -->
                <Icon
                    type="paint"
                    sm
                    class="absolute inset-0 m-auto paint-icon pointer-events-none"
                />
                <input
                    id="brush-color-input"
                    class="invisible"
                    type="color"
                    :value="brushColor"
                    @input="onBrushColorInput"
                    list="presetColors"
                />
            </div>
        </label>
    </div>
</template>

<style scoped>
.brush-palette {
    display: flex;
    flex-wrap: wrap;
    column-gap: 3px;
    row-gap: 5px;
}

.brush-palette-box {
    width: 20px;
    height: 20px;
    cursor: pointer;
    border: 2px solid var(--secondary-color);
    border-radius: 4px;
}

.brush-palette-box.selected {
    border-color: var(--primary-color);
}

/* Invert the icon against whatever color sits behind it. */
.paint-icon {
    mix-blend-mode: difference;
    filter: grayscale(100%);
}
</style>
