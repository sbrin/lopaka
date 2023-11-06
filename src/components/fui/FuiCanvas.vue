<script lang="ts" setup>
import {computed, defineProps, onBeforeUnmount, onMounted, ref, toRefs} from 'vue';
import {useSession} from '../../core/session';

const props = defineProps<{
    fuiImages: any;
    imageDataCache: any;
}>();

const emit = defineEmits(['updateFuiImages']);
const screen = ref(null);
const container = ref(null);
const session = useSession();
const {editor, virtualScreen, state} = session;
const {display, scale, lock} = toRefs(state);

onMounted(() => {
    virtualScreen.setCanvas(screen.value);
    editor.setContainer(container.value as HTMLElement);
    document.addEventListener('mouseup', editor.handleEvent);
    document.addEventListener('keydown', editor.handleEvent);
});

onBeforeUnmount(() => {
    document.removeEventListener('mouseup', editor.handleEvent);
    document.removeEventListener('keydown', editor.handleEvent);
});

function isSelectTool() {
    return false;
}

function isMoving() {
    return false;
}

function isDrawingTool() {
    return false;
}

const canvasClassNames = computed(() => {
    return {
        'fui-canvas_select': isSelectTool(),
        'fui-canvas_moving': isMoving(),
        'fui-canvas_draw': isDrawingTool()
    };
});
</script>
<template>
    <div class="canvas-wrapper">
        <div class="fui-grid" :style="{backgroundSize: `${scale.x}px ${scale.y}px`}">
            <div
                ref="container"
                class="fui-canvas__event-target"
                :class="{locked: lock}"
                @mousedown.prevent="editor.handleEvent"
                @mousemove.prevent="editor.handleEvent"
                @dblclick.prevent="editor.handleEvent"
                @click.prevent="editor.handleEvent"
            >
                <canvas
                    ref="screen"
                    class="screen"
                    :width="display.x"
                    :height="display.y"
                    :style="{width: display.x * scale.x + 'px', height: display.y * scale.y + 'px'}"
                    :class="canvasClassNames"
                />
            </div>
            <!-- <FuiResizableFrame /> -->
            <!-- <div :style="hoverLayerStyle" class="hover-frame"></div> -->
        </div>
    </div>
</template>
<style lang="css">
.canvas-wrapper {
    border: 3px solid var(--border-color);
    border-radius: 10px;
    background: var(--primary-color);
    padding: 8px;
    margin: 16px 0;
    display: inline-block;
    font-size: 0;
    position: relative;
}
.fui-canvas__event-target {
    position: relative;
    overflow: hidden;
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
    /* cursor: crosshair; */
    image-rendering: pixelated;
    background: #ed791b;
    text-rendering: geometricPrecision;
    font-smooth: never;
    -webkit-font-smoothing: none;
    opacity: 0.9;
}
.fui-grid {
    position: relative;
    background-size: 4px 4px;
    background-image: linear-gradient(to right, var(--bg-color) 0.5px, transparent 1px),
        linear-gradient(to bottom, var(--bg-color) 0.5px, transparent 1px);
}
.fui-canvas_select {
    cursor: default;
}

.fui-canvas_moving {
    cursor: grabbing;
}

.fui-canvas_draw {
    cursor: crosshair;
}
</style>
