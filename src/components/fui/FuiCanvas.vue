<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, ref, toRefs} from 'vue';
import {useSession} from '../../core/session';

const props = defineProps<{
    readonly?: Boolean;
}>();

const gridSize = computed(() => {
    return `${scale.value.x}px ${scale.value.y}px`;
});

const gridDisplay = computed(() => {
    return scale.value.x >= 3 ? 'block' : 'none';
});

const screen = ref(null);
const container = ref(null);
const session = useSession();
const {editor, virtualScreen, state} = session;
const {display, scale, lock} = toRefs(state);
const {activeTool} = toRefs(editor.state);

onMounted(() => {
    virtualScreen.setCanvas(screen.value);
    editor.setContainer(container.value as HTMLElement);
    document.addEventListener('mouseup', handleEvent);
    document.addEventListener('keydown', handleEvent);
});

onBeforeUnmount(() => {
    document.removeEventListener('mouseup', handleEvent);
    document.removeEventListener('keydown', handleEvent);
});

function handleEvent(e) {
    if (!props.readonly) {
        editor.handleEvent(e);
    }
}

function isSelectTool() {
    return !activeTool.value;
}

function isDrawingTool() {
    return activeTool.value;
}

const canvasClassNames = computed(() => {
    return {
        'fui-canvas_select': isSelectTool(),
        'fui-canvas_draw': isDrawingTool(),
    };
});
</script>
<template>
    <div
        class="canvas-wrapper"
        :class="{locked: lock}"
    >
        <div class="fui-grid">
            <div
                ref="container"
                class="relative"
                :class="canvasClassNames"
                @mousedown.prevent="editor.handleEvent"
                @mousemove.prevent="handleEvent"
                @touchstart.prevent="handleEvent"
                @touchend.prevent="handleEvent"
                @touchmove.prevent="handleEvent"
                @dblclick.prevent="handleEvent"
                @click.prevent="handleEvent"
                @dragenter.prevent
                @dragover.prevent
                @drop.prevent="handleEvent"
                @contextmenu.prevent
            >
                <canvas
                    ref="screen"
                    class="screen"
                    :width="display.x"
                    :height="display.y"
                    :style="{
                        width: display.x * scale.x + 'px',
                        height: display.y * scale.y + 'px',
                        backgroundColor: session.getPlatformFeatures().screenBgColor,
                    }"
                />
            </div>
        </div>
    </div>
</template>
<style lang="css">
.canvas-wrapper {
    margin: 0 auto;
    display: inline-block;
    font-size: 0;
    position: relative;
    background-color: white;
    height: fit-content;
    border: 10px solid oklch(var(--b1));
}

.fui-canvas__event-target {
    position: relative;
    overflow: visible;
}

.fui-canvas__selection {
    position: absolute;
    border: 2px dashed #ffffff70;
    background-color: #ffffff10;
    box-sizing: content-box;
    z-index: 2;
    pointer-events: none;
    display: none;
    translate: transform(-50%, -50%);
}

.locked {
    opacity: 0.5;
    cursor: wait !important;
    pointer-events: none !important;
}

.screen {
    image-rendering: pixelated;
    background: black;
    text-rendering: geometricPrecision;
    font-smooth: never;
    -webkit-font-smoothing: none;
}

.fui-grid {
    box-sizing: content-box;
    position: relative;
    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background-image: linear-gradient(to right, var(--color-grid) 0.1px, transparent 0.5px),
            linear-gradient(to bottom, var(--color-grid) 0.1px, transparent 0.5px);
        background-size: v-bind(gridSize);
        opacity: 0.2;
        z-index: 1;
        pointer-events: none;
        display: v-bind(gridDisplay);
    }
    border: 1px solid oklch(var(--s));
}

.fui-canvas_select {
    cursor: default;
}

.fui-canvas_draw {
    cursor: crosshair;
}
</style>
