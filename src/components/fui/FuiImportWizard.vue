<script lang="ts" setup>
import {Teleport, computed, nextTick, reactive, ref, toRefs, watch} from 'vue';
import {processImage, imageDataToImage, imageToImageData, applyColor, cropImage, debounce} from '../../utils';
import {useSession} from '../../core/session';
import {Rect} from '../../core/rect';
import {Point} from '../../core/point';
import FuiButton from './FuiButton.vue';
const props = defineProps<{
    visible: boolean;
}>();

const emit = defineEmits(['onClose', 'onSave']);
const {display} = toRefs(useSession().state);
const canvasRef = ref(null);
const imageName = ref('');
const options = reactive({
    dither: true,
    invert: false,
    grayscale: false,
    invertPalette: false,
    resampling: 'nearest',
    width: 0,
    height: 0,
    brightness: 0,
    contrast: 0,
    proportion: 1,
    alpha: true,
    palette: ['#000000', '#FFFFFF']
});
const {proportion} = toRefs(options);

const width = ref(0);
const height = ref(0);

const layerSize = ref(new Rect());

const scale = ref(1);
const scales = [1, 2, 3, 4, 5];
const resamplingTypes = [
    'none',
    'nearest',
    'bilinear',
    'spline',
    'lanczos',
    'gaussian',
    'mitchell',
    'mitchell-netravali',
    'catmull-rom'
];
let image, imageData;

watch(width, (val, oldVal) => {
    if (oldVal && val && proportion.value && val !== oldVal && val < 1000) {
        options.width = val;
        nextTick(() => {
            height.value = Math.round(val / proportion.value);
            options.height = height.value;
        });
    }
});

watch(height, (val, oldVal) => {
    if (oldVal && val && proportion.value && val !== oldVal && val < 1000) {
        options.height = val;
        nextTick(() => {
            width.value = Math.round(val * proportion.value);
            options.width = width.value;
        });
    }
});

const gridSize = computed(() => {
    return `${scale.value}px ${scale.value}px`;
});

const debouncedPreview = debounce(preview, 250);

watch(options, () => {
    debouncedPreview();
});

watch(scale, () => {
    preview();
});

function startCrop(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const pointType = target.classList[0] == 'crop' ? 'center' : Array.from(target.classList)[0].replace('crop-', '');
    const rect = layerSize.value.clone();
    const startPoint = new Point(event.clientX, event.clientY);
    const startRect = layerSize.value.clone();
    const mouseMove = (e: MouseEvent) => {
        const delta = new Point(e.clientX, e.clientY).subtract(startPoint).divide(scale.value);
        if (pointType == 'center') {
            rect.x = startRect.x + delta.x;
            rect.y = startRect.y + delta.y;
        } else if (pointType === 'se') {
            rect.w = startRect.w + delta.x;
            rect.h = startRect.h + delta.y;
        } else if (pointType === 'nw') {
            rect.x = startRect.x + delta.x;
            rect.y = startRect.y + delta.y;
            rect.w = startRect.w - delta.x;
            rect.h = startRect.h - delta.y;
        } else if (pointType === 'ne') {
            rect.y = startRect.y + delta.y;
            rect.w = startRect.w + delta.x;
            rect.h = startRect.h - delta.y;
        } else if (pointType === 'sw') {
            rect.x = startRect.x + delta.x;
            rect.w = startRect.w - delta.x;
            rect.h = startRect.h + delta.y;
        }

        // limit crop rect to image size
        if (rect.x >= 0 && rect.x + rect.w <= options.width) {
            layerSize.value.x = Math.ceil(rect.x);
            layerSize.value.w = Math.floor(rect.w);
        }
        if (rect.y >= 0 && rect.y + rect.h <= options.height) {
            layerSize.value.y = Math.ceil(rect.y);
            layerSize.value.h = Math.floor(rect.h);
        }
    };
    const mouseUp = () => {
        window.removeEventListener('mousemove', mouseMove);
        window.removeEventListener('mouseup', mouseUp);
    };
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', mouseUp);
}

function setImage(sourvceImage: HTMLImageElement, name: string) {
    imageName.value = name;
    imageData = imageToImageData(sourvceImage);
    image = sourvceImage;
    options.proportion = image.width / image.height;
    if (display.value.x > display.value.y) {
        options.height = Math.min(display.value.y, image.height);
        options.width = Math.round(options.height * options.proportion);
    } else {
        options.height = Math.round(options.width / options.proportion);
        options.width = Math.min(display.value.x, image.width);
    }
    layerSize.value.w = options.width;
    layerSize.value.h = options.height;
    layerSize.value.x = 0;
    layerSize.value.y = 0;
    width.value = options.width;
    height.value = options.height;
    scale.value = 2;
    preview();
}

function preview() {
    if (!imageData) return;
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');
    canvas.width = options.width;
    canvas.height = options.height;
    canvas.style.width = options.width * scale.value + 'px';
    canvas.style.height = options.height * scale.value + 'px';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(processImage(imageData, options), 0, 0);
}

function fitToScreen() {
    if (display.value.x > display.value.y) {
        height.value = Math.min(display.value.y, image.height);
    } else {
        width.value = Math.min(display.value.x, image.width);
    }
}

function resetSize() {
    width.value = image.width;
    height.value = image.height;
    preview();
}

function reset() {
    options.brightness = 0;
    options.contrast = 0;
    options.dither = true;
    options.invert = false;
    options.resampling = 'nearest';
    layerSize.value.w = options.width;
    layerSize.value.h = options.height;
    layerSize.value.x = 0;
    layerSize.value.y = 0;
    image = null;
    imageData = null;
}

function cancel() {
    emit('onClose');
}

function save() {
    const imgData = applyColor(cropImage(processImage(imageData, options), layerSize.value.clone().round()), '#000000');
    imageDataToImage(imgData).then((img) => {
        emit('onSave', img, imageName.value, imgData.width, imgData.height);
        reset();
    });
}

defineExpose({
    setImage
});
</script>
<template>
    <Teleport to="body">
        <div class="modal font-sans text-white" v-show="visible" :class="{'opacity-100': visible}">
            <div class="modal-box mb-40 border border-primary max-w-none w-[56rem] pointer-events-auto">
                <div class="grid grid-cols-[60%_auto] grid-rows-3 grid-rows-[auto_1fr_auto]">
                    <div class="flex flex-row">
                        <label class="label" for="image-name">
                            Name:
                            <input
                                class="input input-sm input-bordered ml-2"
                                type="text"
                                v-model="imageName"
                                id="image-name"
                            />
                        </label>
                        <label class="label" for="image-zoom">
                            Zoom:
                            <select id="image-zoom" class="select select-bordered select-sm ml-2" v-model="scale">
                                <option v-for="(p, idx) in scales" :key="idx" :value="p">{{ p * 100 }}%</option>
                            </select>
                        </label>
                    </div>
                    <div class="row-span-2">
                        <div class="flex form-control flex-row gap-4">
                            <label class="label" for="image-width">
                                Width:
                                <input
                                    class="input input-sm input-bordered w-20 ml-2"
                                    type="number"
                                    v-model="width"
                                    id="image-width"
                                />
                            </label>

                            <label class="label" for="image-height">
                                Height:
                                <input
                                    class="input input-sm input-bordered w-20 ml-2"
                                    type="number"
                                    min="1"
                                    v-model="height"
                                    id="image-height"
                                />
                            </label>
                        </div>
                        <div class="form-control flex flex-row gap-4">
                            <FuiButton @click="resetSize">Reset size</FuiButton>
                            <FuiButton @click="fitToScreen">Fit to screen</FuiButton>
                        </div>
                        <div class="form-control flex flex-row gap-4">
                            <label class="label" for="layer-width">
                                Crop W:
                                <input
                                    class="input input-sm input-bordered w-20 ml-2"
                                    type="number"
                                    v-model="layerSize.w"
                                    id="layer-width"
                                />
                            </label>

                            <label class="label" for="layer-height">
                                Crop H:
                                <input
                                    class="input input-sm input-bordered w-20 ml-2"
                                    type="number"
                                    min="1"
                                    v-model="layerSize.h"
                                    id="layer-height"
                                />
                            </label>
                        </div>
                        <div class="form-control flex flex-row gap-4">
                            <label class="label" for="layer-x">
                                Crop X:
                                <input
                                    class="input input-sm input-bordered w-20 ml-2"
                                    type="number"
                                    v-model="layerSize.x"
                                    id="layer-x"
                                />
                            </label>

                            <label class="label" for="layer-y">
                                Crop Y:
                                <input
                                    class="input input-sm input-bordered w-20 ml-2"
                                    type="number"
                                    v-model="layerSize.y"
                                    id="layer-y"
                                />
                            </label>
                        </div>

                        <div class="form-control flex flex-row">
                            <!-- resampling type select -->
                            <label class="label w-full" for="image-resampling">
                                <div class="w-1/3">Resampling</div>
                                <select
                                    id="image-resampling"
                                    class="select select-sm select-bordered ml-2 w-2/3"
                                    v-model="options.resampling"
                                >
                                    <option v-for="(p, idx) in resamplingTypes" :key="idx" :value="p">{{ p }}</option>
                                </select>
                            </label>
                        </div>
                        <div class="form-control flex flex-row">
                            <!-- brightness -->
                            <label class="label w-full" for="image-brightness">
                                <div class="w-1/3">Brightness</div>
                                <input
                                    class="range range-sm range-primary ml-2 w-2/3"
                                    type="range"
                                    min="-100"
                                    max="100"
                                    step="10"
                                    v-model="options.brightness"
                                    id="image-brightness"
                                />
                                <span class="ml-2 w-10">{{ options.brightness }}%</span>
                            </label>
                        </div>
                        <div class="form-control flex flex-row">
                            <!-- contrast -->
                            <label class="label w-full" for="image-contrast">
                                <div class="w-1/3">Contrast</div>
                                <input
                                    class="range range-sm range-primary ml-2 w-2/3"
                                    type="range"
                                    min="-100"
                                    max="100"
                                    step="10"
                                    v-model="options.contrast"
                                    id="image-contrast"
                                />
                                <span class="ml-2 w-10">{{ options.contrast }}%</span>
                            </label>
                        </div>
                        <div class="form-control flex gap-0">
                            <!-- grayscalte first -->
                            <label class="cursor-pointer label">
                                <span class="">Grayscale first</span>
                                <input type="checkbox" class="toggle toggle-primary" v-model="options.grayscale" />
                            </label>
                            <!-- dither -->
                            <label class="cursor-pointer label">
                                <span class="">Dithering</span>
                                <input type="checkbox" class="toggle toggle-primary" v-model="options.dither" />
                            </label>
                            <!-- invert palette -->
                            <label class="cursor-pointer label">
                                <span class="">Invert palette</span>
                                <input type="checkbox" class="toggle toggle-primary" v-model="options.invertPalette" />
                            </label>
                            <!-- invert -->
                            <label class="cursor-pointer label">
                                <span class="">Invert result</span>
                                <input type="checkbox" class="toggle toggle-primary" v-model="options.invert" />
                            </label>
                        </div>
                    </div>
                    <div class="mr-4">
                        <div class="fui-import-wizard-canvas-wrapper" style="width: 100%; height: 100%">
                            <div
                                class="canvasContainer fui-grid"
                                :style="{width: width * scale + 'px', height: height * scale + 'px'}"
                            >
                                <canvas ref="canvasRef"></canvas>
                                <div
                                    class="crop"
                                    @mousedown="startCrop"
                                    :style="{
                                        width: scale * layerSize.w + 'px',
                                        height: scale * layerSize.h + 'px',
                                        left: scale * layerSize.x + 'px',
                                        top: scale * layerSize.y + 'px'
                                    }"
                                >
                                    <div class="crop-nw"></div>
                                    <div class="crop-ne"></div>
                                    <div class="crop-sw"></div>
                                    <div class="crop-se"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-2 flex flex-row justify-between mt-4">
                        <FuiButton @click="cancel" :danger="true">Cancel</FuiButton>
                        <FuiButton @click="save" :success="true">Import</FuiButton>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>
<style lang="css" scoped>
.fui-form-input__size {
    width: 60px;
}
.fui-import-wizard-dialog {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 5px;
    padding: 10px;
    z-index: 100;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.5);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 600px;
}
.fui-import-wizard-canvas-wrapper {
    max-width: 600px;
    max-height: 400px;
    overflow: auto;
    position: relative;
}
.fui-import-wizard-canvas-wrapper .canvasContainer,
.fui-import-wizard-canvas-wrapper canvas {
    /* position: absolute; */
    background-color: black;
    /* left: 50%;
    top: 50%;
    transform: translate(-50%, -50%); */
    image-rendering: pixelated;
    margin: auto;
}
.fui-import-wizard-dialog.visible {
    display: flex;
}
.fui-import-wizard-canvas-crop {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
}
.fui-grid {
    position: relative;
    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background-image: linear-gradient(to right, #999999 0.1px, transparent 0.5px),
            linear-gradient(to bottom, #999999 0.1px, transparent 0.5px);
        background-size: v-bind(gridSize);
        opacity: 0.6;
        z-index: 1;
    }
}
.crop {
    position: absolute;
    border: 1px solid #2196f3;
    z-index: 3;
    box-shadow: 0 0 0 9999px rgb(0 0 0 / 77%);
}
.crop .crop-nw,
.crop .crop-ne,
.crop .crop-sw,
.crop .crop-se {
    position: absolute;
    width: 10px;
    height: 10px;
    z-index: 2;
}
.crop .crop-nw {
    top: 0;
    left: 0;
    cursor: nw-resize;
}
.crop .crop-ne {
    top: 0;
    right: 0;
    cursor: ne-resize;
}
.crop .crop-sw {
    bottom: 0;
    left: 0;
    cursor: sw-resize;
}
.crop .crop-se {
    bottom: 0;
    right: 0;
    cursor: se-resize;
}
</style>
