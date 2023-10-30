<script setup lang="ts">
import {computed, defineEmits, ref, toRefs} from 'vue';
import {Point} from '../../../core/point';
import {useSession} from '../../../core/session';
const emit = defineEmits(['resize']);
enum Region {
    N = 'N',
    NE = 'NE',
    E = 'E',
    SE = 'SE',
    S = 'S',
    SW = 'SW',
    W = 'W',
    NW = 'NW'
}
const session = useSession();
const {activeLayer, activeTool, scale} = toRefs(session.state);
const resize = ref(false);
let position: Point = null;
let region: Region = null;
let originalPos: Point = null;
let originalSize: Point = null;
const resizableTypes = ['circle', 'disc', 'box', 'frame'];
const resizable = computed(
    () => activeLayer.value && !activeLayer.value.isStub() && resizableTypes.includes(activeLayer.value.type)
);

function onMouseDown(e: MouseEvent) {
    region = Region[(e.target as HTMLElement).dataset.region];
    if (region) {
        resize.value = true;
        position = new Point(e.pageX, e.pageY);
        originalSize = activeLayer.value.size.clone();
        originalPos = activeLayer.value.position.clone();
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
}

function onMouseMove(e: MouseEvent) {
    const params = activeTool.value.getParams();
    const resizeX = params.find((p) => p.name == 'x');
    const resizeY = params.find((p) => p.name == 'y');
    const resizeW = params.find((p) => p.name == 'w');
    const resizeH = params.find((p) => p.name == 'h');
    const resizeR = params.find((p) => p.name == 'radius');
    const offset = position.clone().subtract(e.pageX, e.pageY).divide(scale.value).round();
    console.log(offset.xy);
    switch (region) {
        case Region.NE:
            if (resizeR) {
                resizeR.onChange(originalSize.x / 2 + offset.y);
            }
            if (resizeY) {
                resizeY.onChange(originalPos.y - offset.y);
            }
            if (resizeH) {
                resizeH.onChange(originalSize.y + offset.y);
            }
            if (resizeX) {
                resizeX.onChange(originalPos.x);
            }
            if (resizeW) {
                resizeW.onChange(originalSize.x - offset.x);
            }
            break;
        case Region.SE:
            if (resizeR) {
                resizeR.onChange(originalSize.x / 2 - offset.y);
            }
            if (resizeY) {
                resizeY.onChange(originalPos.y);
            }
            if (resizeH) {
                resizeH.onChange(originalSize.y - offset.y);
            }
            if (resizeX) {
                resizeX.onChange(originalPos.x);
            }
            if (resizeW) {
                resizeW.onChange(originalSize.x - offset.x);
            }
            break;
        case Region.SW:
            if (resizeR) {
                resizeR.onChange(originalSize.x / 2 - offset.y);
            }
            if (resizeY) {
                resizeY.onChange(originalPos.y);
            }
            if (resizeH) {
                resizeH.onChange(originalSize.y - offset.y);
            }
            if (resizeX) {
                resizeX.onChange(originalPos.x - offset.x);
            }
            if (resizeW) {
                resizeW.onChange(originalSize.x + offset.x);
            }
            break;
        case Region.NW:
            if (resizeR) {
                resizeR.onChange(originalSize.x / 2 + offset.y);
            }
            if (resizeY) {
                resizeY.onChange(originalPos.y - offset.y);
            }
            if (resizeH) {
                resizeH.onChange(originalSize.y + offset.y);
            }
            if (resizeX) {
                resizeX.onChange(originalPos.x - offset.x);
            }
            if (resizeW) {
                resizeW.onChange(originalSize.x + offset.x);
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
        <!-- <span class="resize region_n" :data-region="Region.N"></span> -->
        <span class="resize region_ne" :data-region="Region.NE"></span>
        <!-- <span class="resize region_e" :data-region="Region.E"></span> -->
        <span class="resize region_se" :data-region="Region.SE"></span>
        <!-- <span class="resize region_s" :data-region="Region.S"></span> -->
        <span class="resize region_sw" :data-region="Region.SW"></span>
        <!-- <span class="resize region_w" :data-region="Region.W"></span> -->
        <span class="resize region_nw" :data-region="Region.NW"></span>
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

/* .resizable-frame .resize.region_n {
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
    cursor: n-resize;
} */
.resizable-frame .resize.region_ne {
    top: 0;
    right: 0;
    transform: translate(50%, -50%);
    cursor: nesw-resize;
}
/* .resizable-frame .resize.region_e {
    top: 50%;
    right: 0;
    transform: translate(50%, -50%);
    cursor: e-resize;
} */
.resizable-frame .resize.region_se {
    bottom: 0;
    right: 0;
    transform: translate(50%, 50%);
    cursor: nwse-resize;
}
/* .resizable-frame .resize.region_s {
    bottom: 0;
    left: 50%;
    transform: translate(-50%, 50%);
    cursor: s-resize;
} */
.resizable-frame .resize.region_sw {
    bottom: 0;
    left: 0;
    transform: translate(-50%, 50%);
    cursor: nesw-resize;
}
/* .resizable-frame .resize.region_w {
    top: 50%;
    left: 0;
    transform: translate(-50%, -50%);
    cursor: w-resize;
} */
.resizable-frame .resize.region_nw {
    top: 0;
    left: 0;
    transform: translate(-50%, -50%);
    cursor: nwse-resize;
}
</style>
