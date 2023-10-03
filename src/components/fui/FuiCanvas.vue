<script lang="ts" setup>
import {computed, defineProps, onBeforeUnmount, onMounted, ref, toRefs} from 'vue';
import {Point} from '../../core/point';
import {useSession} from '../../core/session';

const props = defineProps<{
    fuiImages: any;
    imageDataCache: any;
}>();

const emit = defineEmits(['updateFuiImages']);
const screen = ref(null);
const session = useSession();

const {display, virtualScreen, activeTool, scale} = toRefs(session);
let mouseClickPosition: Point;

onMounted(() => {
    virtualScreen.value.setCanvas(screen.value);
    document.addEventListener('mouseup', onMouseUp);
});

onBeforeUnmount(() => {
    document.removeEventListener('mouseup', onMouseUp);
});

function isSelectTool() {
    return activeTool.value.getName() === 'select';
}

function isMoving() {
    // return  && activeTool.value.isDrawing;
    return false;
}

function isDrawingTool() {
    return activeTool.value.isDrawing;
}

const canvasClassNames = computed(() => {
    return {
        'fui-canvas_select': isSelectTool(),
        'fui-canvas_moving': isMoving(),
        'fui-canvas_draw': isDrawingTool()
    };
    return {};
});

function onMouseDown(e: MouseEvent) {
    // if (e.button === 0) {
    // })
    const position = new Point(e.offsetX, e.offsetY);
    activeTool.value.onMouseDown(position.clone(), e);
    mouseClickPosition = position;
}

function onMouseMove(e: MouseEvent) {
    if (activeTool.value.isDrawing) {
        const position = new Point(e.offsetX, e.offsetY);
        activeTool.value.onMouseMove(position.clone(), e);
        mouseClickPosition = position;
    }
}

function onMouseUp(e: MouseEvent) {
    const position = new Point(e.offsetX, e.offsetY);
    if (activeTool.value.isDrawing) {
        activeTool.value.onMouseUp(position.clone(), e);
    }
}

function onMouseLeave(e: MouseEvent) {
    const position = new Point(e.offsetX, e.offsetY);
    if (activeTool.value.isDrawing) {
    }
}

function onDrop(e: DragEvent) {}
</script>
<template>
    <div class="canvas-wrapper">
        <div class="fui-grid" :style="{backgroundSize: `${scale.x}px ${scale.y}px`}">
            <canvas
                ref="screen"
                style="image-rendering: pixelated; image-rendering: crisp-edges"
                :width="display.x"
                :height="display.y"
                :style="{width: display.x * scale.x + 'px', height: display.y * scale.y + 'px'}"
                :class="canvasClassNames"
                @mousedown.prevent="onMouseDown"
                @mousemove.prevent="onMouseMove"
                @mouseleave.prevent="onMouseLeave"
                @dragover.prevent
                @drop="onDrop"
            />
            <!-- <div class="fui-cursor fui-cursor_pixel" ref="cursor"></div> -->
        </div>
    </div>
</template>
<style lang="css"></style>
