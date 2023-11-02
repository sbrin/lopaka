<script lang="ts" setup>
import {ShallowRef, computed, defineProps, onBeforeUnmount, onMounted, ref, toRefs} from 'vue';
import {Point} from '../../core/point';
import {useSession} from '../../core/session';
import FuiResizableFrame from './components/FuiResizableFrame.vue';
import {EditMode} from '../../core/layers/abstract.layer';

const props = defineProps<{
    fuiImages: any;
    imageDataCache: any;
}>();

const emit = defineEmits(['updateFuiImages']);
const screen = ref(null);
const session = useSession();

const isDrawing = ref(false);

let selectionMove = false; //todo

const {display, activeTool, scale, lock} = toRefs(session.state);

// const activeLayerStyle = computed(() =>
//     activeLayer.value && !activeLayer.value.added
//         ? {
//               left: activeLayer.value.bounds.x * scale.value.x - 1 + 'px',
//               top: activeLayer.value.bounds.y * scale.value.x - 1 + 'px',
//               width: activeLayer.value.bounds.w * scale.value.x + 'px',
//               height: activeLayer.value.bounds.h * scale.value.x + 'px'
//           }
//         : {display: 'none'}
// );

// const hoverLayerStyle = computed(() =>
//     hoverLayer.value && !hoverLayer.value.isStub()
//         ? {
//               left: hoverLayer.value.bounds.x * scale.value.x - 1 + 'px',
//               top: hoverLayer.value.bounds.y * scale.value.x - 1 + 'px',
//               width: hoverLayer.value.bounds.w * scale.value.x + 'px',
//               height: hoverLayer.value.bounds.h * scale.value.x + 'px'
//           }
//         : {display: 'none'}
// );

onMounted(() => {
    session.virtualScreen.setCanvas(screen.value);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('keydown', onKeyDown);
});

function isSelectTool() {
    return false; //hoverLayer.value;
}

function isMoving() {
    return activeTool.value.getName() === 'select' && activeTool.value.isDrawing();
}

function isDrawingTool() {
    return false; //activeTool.value.getName() !== 'select' && !activeLayer.value;
}

const canvasClassNames = computed(() => {
    return {
        'fui-canvas_select': isSelectTool(),
        'fui-canvas_moving': isMoving(),
        'fui-canvas_draw': isDrawingTool()
    };
});

function onMouseDown(e: MouseEvent) {
    if (e.button === 0) {
        const position = new Point(e.offsetX, e.offsetY);
        isDrawing.value = true;
        const selection = session.state.layers.filter((layer) => layer.selected);
        const layersInPoint = session.virtualScreen.getLayersInPoint(position);
        // if there is layers in point
        if (layersInPoint.length) {
            const upperLayer = layersInPoint[0];
            if (selection.includes(upperLayer)) {
                // click on selected layer
                if (e.ctrlKey || e.metaKey) {
                    // deselect layer
                    upperLayer.selected = false;
                } else {
                    selectionMove = true;
                }
            } else {
                // click on unselected layer
                if (e.ctrlKey || e.metaKey) {
                    // add layer to selection
                    upperLayer.selected = true;
                } else {
                    // select layer and deselect others
                    selection.forEach((layer) => (layer.selected = false));
                    upperLayer.selected = true;
                    selectionMove = true;
                }
            }
            if (selectionMove) {
                session.state.layers
                    .filter((layer) => layer.selected)
                    .forEach((layer) => layer.startEdit(EditMode.MOVING, position.clone().divide(scale.value)));
            }
        } else {
            // click on empty space
            if (activeTool.value.getName() === 'select') {
                // if pointer tool is active, deselect all layers and stop editing
                selection.forEach((layer) => ((layer.selected = false), layer.isEditing() && layer.stopEdit()));
            } else {
                activeTool.value.onMouseDown(position.clone(), e);
            }
        }
        session.virtualScreen.updateMousePosition(position.clone());
    }

    // if there is no selected layers

    // if (activeTool.value.isModifier) {
    //     const layersInPoint = session.virtualScreen.getLayersInPoint(position);
    //     if (layersInPoint.length > 0) {
    //         const layer = layersInPoint.sort((a, b) => b.index - a.index)[0];
    //         activeLayer.value = layer;
    //         activeTool.value.onMouseDown(position.clone(), e);
    //     } else {
    //         // reset selection
    //         activeLayer.value = null;
    //     }
    // } else {
    //     activeTool.value.onMouseDown(position.clone(), e);
    // }
}

function onDblclick(e: MouseEvent) {
    const position = new Point(e.offsetX, e.offsetY);
    isDrawing.value = true;
    const selection = session.state.layers.filter((layer) => layer.selected);
    const layersInPoint = session.virtualScreen.getLayersInPoint(position);
    if (layersInPoint) {
        const upperLayer = layersInPoint[0];
        // activeLayer.value = upperLayer;
        // upperLayer.edititng = true;
    }
    // session.virtualScreen.updateMousePosition(position.clone());
}

function onMouseMove(e: MouseEvent) {
    const position = new Point(e.offsetX, e.offsetY);
    if (activeTool.value?.isDrawing()) {
        activeTool.value.onMouseMove(position.clone(), e);
    } else if (selectionMove) {
        const selection = session.state.layers.filter((layer) => layer.selected);
        selection.forEach((layer) => layer.edit(position.clone().divide(scale.value), e));
        // selection.forEach((layer: Layer) => {
        //     // const tool = session.tools[layer.type];
        //     // console.log(e.movementX, e.movementY);
        //     // const pos = layer.position.clone().add(new Point(e.movementX, e.movementY).divide(scale.value));
        //     // const params = tool.getNamedParams(layer);
        //     // params.x.onChange(pos.x);
        //     // params.y.onChange(pos.y);
        // });
    }
    // } else {
    //     const layers = session.virtualScreen.getLayersInPoint(position);
    //     hoverLayer.value = layers.sort((a, b) => b.index - a.index)[0];
    // }
    session.virtualScreen.updateMousePosition(position.clone());
}

function onMouseUp(e: MouseEvent) {
    if (selectionMove) {
        const selection = session.state.layers.filter((layer) => layer.selected);
        selection.forEach((layer) => layer.stopEdit());
        selectionMove = false;
    }
    if (isDrawing.value) {
        const position = new Point(e.offsetX, e.offsetY);
        if (activeTool.value.isDrawing()) {
            activeTool.value.onMouseUp(position.clone(), e);
        }
        // activeTool.value = session.tools.select;
        isDrawing.value = false;
    }
}

function onKeyDown(e: KeyboardEvent) {
    if (e.target === document.body) {
        activeTool.value?.onKeyDown(e);
    }
}
</script>
<template>
    <div class="canvas-wrapper" :class="{locked: lock}">
        <div class="fui-grid" :style="{backgroundSize: `${scale.x}px ${scale.y}px`}">
            <canvas
                ref="screen"
                class="screen"
                :width="display.x"
                :height="display.y"
                :style="{width: display.x * scale.x + 'px', height: display.y * scale.y + 'px'}"
                :class="canvasClassNames"
                @mousedown.prevent="onMouseDown"
                @mousemove.prevent="onMouseMove"
                @dblclick.prevent="onDblclick"
            />
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

.hover-frame {
    border: 1px solid #ffffff70;
    /* box-shadow: 0px 0px 2px 0px rgba(0, 249, 216, 0.5); */
    position: absolute;
    box-sizing: content-box;
    z-index: 2;
    pointer-events: none;
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
