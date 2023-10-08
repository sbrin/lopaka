<script lang="ts" setup>
import {Ref, ShallowRef, computed, defineProps, onBeforeUnmount, onMounted, ref, toRefs, watch, watchEffect} from 'vue';
import {Point} from '../../core/point';
import {useSession} from '../../core/session';
import {Rect} from '../../core/rect';
import {Layer} from '../../core/layer';

const props = defineProps<{
    fuiImages: any;
    imageDataCache: any;
}>();

const emit = defineEmits(['updateFuiImages']);
const screen = ref(null);
const session = useSession();

const hoveredLayer: ShallowRef<Layer> = ref(null);

const {display, virtualScreen, activeTool, scale, activeLayer} = toRefs(session);
let mouseClickPosition: Point;

onMounted(() => {
    virtualScreen.value.setCanvas(screen.value);
    document.addEventListener('mouseup', onMouseUp);
});

onBeforeUnmount(() => {
    document.removeEventListener('mouseup', onMouseUp);
});

// watch(
//     [activeLayer, scale],
//     ([layer, s]) => {
//         if (layer) {
//             editFrame.value = layer.bounds.clone().multiply(s.x);
//         }
//     },
//     {
//         deep: true
//     }
// );

function isSelectTool() {
    return false; //activeTool.() === 'select';
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
    if (activeTool.value.isModifier) {
        const layersInPoint = session.virtualScreen.getLayersInPoint(position);
        if (layersInPoint.length > 0) {
            const layer = layersInPoint.sort((a, b) => a.index - b.index)[0];
            activeLayer.value = layer;
            activeTool.value.onMouseDown(position.clone(), e);
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
        // console.log(layers);
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
.edit-frame {
    border: 1px dashed #fff;
    position: absolute;
    box-sizing: content-box;
    box-shadow: 0px 0px 2px 0px black;
    position: absolute;
    pointer-events: none;
    display: none;
}
.hovered-frame {
    border: 1px solid yellow;
    position: absolute;
    box-sizing: content-box;
    z-index: 2;
    pointer-events: none;
    display: none;
}
</style>
