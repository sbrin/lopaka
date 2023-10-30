<script setup lang="ts">
import {computed, defineEmits, ref, toRefs} from 'vue';
import {Point} from '../../../core/point';
import {useSession} from '../../../core/session';
const emit = defineEmits(['resize']);
enum Direction {
    NE = 'NE',
    SE = 'SE',
    SW = 'SW',
    NW = 'NW'
}
const session = useSession();
const {activeLayer, activeTool, scale} = toRefs(session.state);
const resize = ref(false);
let position: Point = null;
let direction: Direction = null;
let originalPos: Point = null;
let originalSize: Point = null;
const resizableTypes = ['circle', 'disc', 'box', 'frame'];
const resizable = computed(
    () =>
        activeLayer.value &&
        !activeLayer.value.isStub() &&
        !activeLayer.value.edititng &&
        resizableTypes.includes(activeLayer.value.type)
);
const params = computed(() => {
    if (resizable.value) {
        return activeTool.value.getParams().reduce((acc, param) => {
            acc[param.name] = param.onChange;
            return acc;
        }, {});
    }
    return {};
});

function onMouseDown(e: MouseEvent) {
    direction = Direction[(e.target as HTMLElement).dataset.direction];
    if (direction) {
        resize.value = true;
        position = new Point(e.pageX, e.pageY);
        originalSize = activeLayer.value.size.clone();
        originalPos = activeLayer.value.position.clone();
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
}

function onMouseMove(e: MouseEvent) {
    const resizeX = params.value['x'];
    const resizeY = params.value['y'];
    const resizeW = params.value['w'];
    const resizeH = params.value['h'];
    const resizeR = params.value['radius'];
    const offset = position.clone().subtract(e.pageX, e.pageY).divide(scale.value).round();
    switch (direction) {
        case Direction.NE:
            if (resizeR) {
                resizeR(Math.floor(originalSize.x / 2 - offset.x / 2));
                resizeY(Math.floor(originalPos.y + Math.round(offset.x / 2) * 2));
            } else {
                resizeY(originalPos.y - offset.y);
                resizeH(Math.max(originalSize.y + offset.y, 1));
                resizeX(originalPos.x);
                resizeW(Math.max(originalSize.x - offset.x, 1));
            }
            break;
        case Direction.SE:
            if (resizeR) {
                resizeR(Math.round(originalSize.x / 2 - offset.x / 2));
            } else {
                resizeY(originalPos.y);
                resizeH(Math.max(originalSize.y - offset.y, 1));
                resizeX(originalPos.x);
                resizeW(Math.max(originalSize.x - offset.x, 1));
            }
            break;
        case Direction.SW:
            if (resizeR) {
                resizeR(Math.ceil(originalSize.x / 2 + offset.x / 2));
                resizeX(Math.ceil(originalPos.x - Math.round(offset.x / 2) * 2));
            } else {
                resizeY(originalPos.y);
                resizeH(Math.max(originalSize.y - offset.y, 1));
                resizeX(originalPos.x - offset.x);
                resizeW(Math.max(originalSize.x + offset.x, 1));
            }
            break;
        case Direction.NW:
            if (resizeR) {
                resizeR(Math.ceil(originalSize.x / 2 + offset.x / 2));
                resizeX(Math.ceil(originalPos.x - Math.round(offset.x / 2) * 2));
                resizeY(Math.ceil(originalPos.y - Math.round(offset.x / 2) * 2));
            } else {
                resizeY(originalPos.y - offset.y);
                resizeH(Math.max(originalSize.y + offset.y, 1));
                resizeX(originalPos.x - offset.x);
                resizeW(Math.max(originalSize.x + offset.x, 1));
            }
            break;
    }
}

function onMouseUp() {
    resize.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}
</script>
<template>
    <div class="resizable-frame" @mousedown.prevent="onMouseDown" :class="{resizable}">
        <span class="resize direction_ne" :data-direction="Direction.NE"></span>
        <span class="resize direction_se" :data-direction="Direction.SE"></span>
        <span class="resize direction_sw" :data-direction="Direction.SW"></span>
        <span class="resize direction_nw" :data-direction="Direction.NW"></span>
    </div>
</template>
<style lang="css">
.resizable-frame {
    border: 1px dashed #ffffff;
    position: absolute;
    box-sizing: content-box;
    z-index: 2;
    pointer-events: none;
}

.resizable-frame.resizable .resize {
    display: block;
}

.resizable-frame > .resize {
    position: absolute;
    width: 6px;
    height: 6px;
    background: #ffffffdd;
    border-radius: 50%;
    pointer-events: all;
    display: none;
}

.resizable-frame .resize.direction_ne {
    top: 0;
    right: 0;
    transform: translate(50%, -50%);
    cursor: nesw-resize;
}

.resizable-frame .resize.direction_se {
    bottom: 0;
    right: 0;
    transform: translate(50%, 50%);
    cursor: nwse-resize;
}

.resizable-frame .resize.direction_sw {
    bottom: 0;
    left: 0;
    transform: translate(-50%, 50%);
    cursor: nesw-resize;
}

.resizable-frame .resize.direction_nw {
    top: 0;
    left: 0;
    transform: translate(-50%, -50%);
    cursor: nwse-resize;
}
</style>
