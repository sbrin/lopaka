<script lang="ts" setup>
import {ShallowRef, computed, defineProps, onBeforeUnmount, onMounted, ref, toRefs} from 'vue';
import {Layer} from '../../core/layer';
import {Point} from '../../core/point';
import {useSession} from '../../core/session';

const props = defineProps<{
    fuiImages: any;
    imageDataCache: any;
}>();

const emit = defineEmits(['updateFuiImages']);
const screen = ref(null);
const session = useSession();

const hoveredLayer: ShallowRef<Layer> = ref(null);

const {display, activeTool, scale, activeLayer} = toRefs(session.state);
let mouseClickPosition: Point;

onMounted(() => {
    session.virtualScreen.setCanvas(screen.value);
    document.addEventListener('mouseup', onMouseUp);
});

onBeforeUnmount(() => {
    document.removeEventListener('mouseup', onMouseUp);
});

function isSelectTool() {
    return hoveredLayer.value;
}

function isMoving() {
    return activeTool.value.getName() === 'select' && activeTool.value.isDrawing;
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
});

function onMouseDown(e: MouseEvent) {
    // if (e.button === 0) {
    // })
    const position = new Point(e.offsetX, e.offsetY);
    if (activeTool.value.isModifier) {
        const layersInPoint = session.virtualScreen.getLayersInPoint(position);
        if (layersInPoint.length > 0) {
            const layer = layersInPoint.sort((a, b) => a.index - b.index)[0];
            activeLayer.value = layer;
            activeTool.value.onMouseDown(position.clone(), e);
        } else {
            // reset selection
            activeLayer.value = null;
        }
    } else {
        activeTool.value.onMouseDown(position.clone(), e);
    }
    mouseClickPosition = position;
}

function onMouseMove(e: MouseEvent) {
    const position = new Point(e.offsetX, e.offsetY);
    if (activeTool.value.isDrawing) {
        activeTool.value.onMouseMove(position.clone(), e);
        mouseClickPosition = position;
    } else {
        const layers = session.virtualScreen.getLayersInPoint(position);
        hoveredLayer.value = layers.sort((a, b) => a.index - b.index)[0];
    }
}

function onMouseUp(e: MouseEvent) {
    const position = new Point(e.offsetX, e.offsetY);
    if (activeTool.value.isDrawing) {
        activeTool.value.onMouseUp(position.clone(), e);
    }
    activeTool.value = session.tools.select;
}

function onMouseLeave(e: MouseEvent) {
    // const position = new Point(e.offsetX, e.offsetY);
    // if (activeTool.value.isDrawing) {
    // }
}

function onDrop(e: DragEvent) {}
</script>
<template>
    <div class="canvas-wrapper">
        <div class="fui-grid" :style="{backgroundSize: `${scale.x}px ${scale.y}px`}">
            <canvas
                ref="screen"
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
            <div
                v-if="activeLayer"
                :style="{
                    left: activeLayer.bounds.x * scale.x + 'px',
                    top: activeLayer.bounds.y * scale.x + 'px',
                    width: activeLayer.bounds.w * scale.x + 'px',
                    height: activeLayer.bounds.h * scale.x + 'px'
                }"
                class="edit-frame"
            ></div>
            <div
                v-if="hoveredLayer"
                :style="{
                    left: hoveredLayer.bounds.x * scale.x + 'px',
                    top: hoveredLayer.bounds.y * scale.x + 'px',
                    width: hoveredLayer.bounds.w * scale.x + 'px',
                    height: hoveredLayer.bounds.h * scale.x + 'px'
                }"
                class="hovered-frame"
            ></div>
        </div>
    </div>
</template>
<style lang="css">
.fui-grid {
    position: relative;
}
.edit-frame,
.hovered-frame {
    border: 1px dashed rgba(0, 249, 216, 1);
    box-shadow: 0px 0px 2px 0px rgba(0, 249, 216, 0.5);
    position: absolute;
    box-sizing: content-box;
    z-index: 2;
    pointer-events: none;
}
.hovered-frame {
    border: 1px solid rgba(0, 249, 216, 0.5);
}
</style>
