<script lang="ts" setup>
import {computed, nextTick, reactive, ref, toRefs, watch} from 'vue';
import {processImage, imageDataToImage, imageToImageData, applyColor, cropImage, debounce} from '/src/utils';
import {useSession} from '/src/core/session';
import {Rect} from '/src/core/rect';
import {Point} from '/src/core/point';
import Button from '/src/components/layout/Button.vue';
const props = defineProps<{
    single: boolean;
}>();

const emit = defineEmits(['onClose', 'onSave']);
const {display} = toRefs(useSession().state);
const canvasRef = ref(null);
const imageName = ref('');
const options = reactive({
    dither: true,
    invert: true,
    grayscale: false,
    invertPalette: false,
    resampling: 'nearest',
    width: 0,
    height: 0,
    brightness: 0,
    contrast: 0,
    proportion: 1,
    alpha: true,
    palette: ['#000000', '#FFFFFF'],
});
const {proportion} = toRefs(options);

const width = ref(0);
const height = ref(0);

const layerSize = ref(new Rect());

const scale = ref(2);
const resamplingTypes = [
    'none',
    'nearest',
    'bilinear',
    'spline',
    'lanczos',
    'gaussian',
    'mitchell',
    'mitchell-netravali',
    'catmull-rom',
];
let image;

watch(width, (val: number, oldVal: number) => {
    if (oldVal && val && proportion.value && val !== oldVal && val < 1000) {
        options.width = val;
        nextTick(() => {
            height.value = Math.round(val / proportion.value);
            options.height = height.value;
            layerSize.value.w = val;
            if (layerSize.value.x > val) layerSize.value.x = 0;
        });
    }
});

watch(height, (val: number, oldVal: number) => {
    if (oldVal && val && proportion.value && val !== oldVal && val < 1000) {
        options.height = val;
        nextTick(() => {
            width.value = Math.round(val * proportion.value);
            options.width = width.value;
            layerSize.value.h = val;
            if (layerSize.value.y > val) layerSize.value.y = 0;
        });
    }
});

const gridSize = computed(() => {
    return `${scale.value}px ${scale.value}px`;
});

const gridDisplay = computed(() => {
    return scale.value >= 4 ? 'block' : 'none';
});

const debouncedPreview = debounce(() => {
    preview(image);
}, 250);

watch(options, () => {
    debouncedPreview();
});

watch(
    scale,
    debounce(() => preview(image), 500)
);

function setOptions(sourceImage: HTMLImageElement) {
    options.proportion = sourceImage.width / sourceImage.height;
    if (display.value.x > display.value.y) {
        options.height = Math.min(display.value.y, sourceImage.height);
        options.width = Math.round(options.height * options.proportion);
    } else {
        options.width = Math.min(display.value.x, sourceImage.width);
        options.height = Math.round(options.width / options.proportion);
    }
    layerSize.value.w = options.width;
    layerSize.value.h = options.height;
    layerSize.value.x = 0;
    layerSize.value.y = 0;
    width.value = options.width;
    height.value = options.height;
}

function setImage(name: string, sourceImage: HTMLImageElement) {
    image = sourceImage;
    imageName.value = name;
    setOptions(sourceImage);
    preview(sourceImage);
}

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
            rect.w = Math.max(1, startRect.w + delta.x);
            rect.h = Math.max(1, startRect.h + delta.y);
        } else if (pointType === 'nw') {
            rect.x = Math.min(startRect.x + startRect.w, startRect.x + delta.x);
            rect.y = Math.min(startRect.y + startRect.h, startRect.y + delta.y);
            rect.w = Math.max(1, startRect.w - delta.x);
            rect.h = Math.max(1, startRect.h - delta.y);
        } else if (pointType === 'ne') {
            rect.y = Math.min(startRect.y + startRect.h, startRect.y + delta.y);
            rect.w = Math.max(1, startRect.w + delta.x);
            rect.h = Math.max(1, startRect.h - delta.y);
        } else if (pointType === 'sw') {
            rect.x = Math.min(startRect.x + startRect.w, startRect.x + delta.x);
            rect.w = Math.max(1, startRect.w - delta.x);
            rect.h = Math.max(1, startRect.h + delta.y);
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

function preview(sourceImage) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = options.width;
    canvas.height = options.height;
    canvas.style.width = options.width * scale.value + 'px';
    canvas.style.height = options.height * scale.value + 'px';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const imageData = imageToImageData(sourceImage);
    ctx.putImageData(processImage(imageData, options), 0, 0);
}

function fitToScreen() {
    if (display.value.x > display.value.y) {
        height.value = Math.min(display.value.y, image.height);
    } else {
        width.value = Math.min(display.value.x, image.width);
    }
    layerSize.value.h = height.value;
    layerSize.value.w = width.value;
}

function resetSize() {
    width.value = image.width;
    height.value = image.height;
    layerSize.value.w = image.width;
    layerSize.value.h = image.height;
    layerSize.value.x = 0;
    layerSize.value.y = 0;
    preview(image);
}

function resetContrast() {
    options.contrast = 0;
}

function resetBrightness() {
    options.brightness = 0;
}

function normalizeNumbers(event) {
    const value = parseFloat(event.target.value);
    if (isNaN(value) || value <= 0) {
        event.target.value = 1;
    } else {
        event.target.value = value;
    }
}

async function process(sourceImage) {
    if (!props.single) {
        setOptions(sourceImage);
    }
    const imageData = imageToImageData(sourceImage);
    const imageDataProcessed = applyColor(
        cropImage(processImage(imageData, options), layerSize.value.clone().round()),
        '#FFFFFF'
    );
    const img = await imageDataToImage(imageDataProcessed);
    return [img, imageDataProcessed.width, imageDataProcessed.height];
}

defineExpose({
    setImage,
    process,
});
</script>
<template>
    <div class="flex-1 max-w-[60%]">
        <div class="flex flex-row">
            <label
                class="label"
                for="image-name"
            >
                Name:
                <input
                    class="input input-sm input-bordered ml-2"
                    type="text"
                    v-model="imageName"
                    id="image-name"
                    :disabled="!single"
                />
            </label>
            <label
                class="label"
                for="image-zoom"
            >
                <label
                    for="canvas-scale"
                    class="pr-2"
                >
                    Zoom:
                </label>
                <div
                    class="tooltip tooltip-right"
                    :data-tip="`${scale * 100}%`"
                >
                    <input
                        class="range range-xs range-accent w-32 mt-1"
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        v-model="scale"
                        id="canvas-scale"
                        @dblclick="scale = 1"
                    />
                </div>
            </label>
        </div>
        <div class="max-w-[500px] overflow-auto h-[500px] flex justify-center items-center">
            <div
                class="canvasContainer fui-grid"
                :style="{width: width * scale + 'px', height: height * scale + 'px'}"
            >
                <canvas ref="canvasRef"></canvas>
                <div
                    v-if="single"
                    class="crop"
                    @mousedown="startCrop"
                    :style="{
                        width: scale * layerSize.w + 'px',
                        height: scale * layerSize.h + 'px',
                        left: scale * layerSize.x + 'px',
                        top: scale * layerSize.y + 'px',
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
    <div class="row-span-2">
        <template v-if="single">
            <div class="flex form-control flex-row gap-4">
                <label
                    class="label"
                    for="image-width"
                >
                    Width:
                    <input
                        class="input input-sm input-bordered w-20 ml-2"
                        type="number"
                        min="1"
                        v-model="width"
                        id="image-width"
                        @input="normalizeNumbers"
                    />
                </label>

                <label
                    class="label"
                    for="image-height"
                >
                    Height:
                    <input
                        class="input input-sm input-bordered w-20 ml-2"
                        type="number"
                        min="1"
                        v-model="height"
                        id="image-height"
                        @input="normalizeNumbers"
                    />
                </label>
            </div>
            <div class="form-control flex flex-row gap-4">
                <Button @click="resetSize">Reset size</Button>
                <Button @click="fitToScreen">Fit to screen</Button>
            </div>
            <div class="form-control flex flex-row gap-4">
                <label
                    class="label"
                    for="layer-width"
                >
                    Crop W:
                    <input
                        class="input input-sm input-bordered w-20 ml-2"
                        type="number"
                        min="1"
                        v-model="layerSize.w"
                        id="layer-width"
                        @input="normalizeNumbers"
                    />
                </label>

                <label
                    class="label"
                    for="layer-height"
                >
                    Crop H:
                    <input
                        class="input input-sm input-bordered w-20 ml-2"
                        type="number"
                        min="1"
                        v-model="layerSize.h"
                        id="layer-height"
                        @input="normalizeNumbers"
                    />
                </label>
            </div>
            <div class="form-control flex flex-row gap-4">
                <label
                    class="label"
                    for="layer-x"
                >
                    Crop X:
                    <input
                        class="input input-sm input-bordered w-20 ml-2"
                        type="number"
                        v-model="layerSize.x"
                        id="layer-x"
                    />
                </label>

                <label
                    class="label"
                    for="layer-y"
                >
                    Crop Y:
                    <input
                        class="input input-sm input-bordered w-20 ml-2"
                        type="number"
                        v-model="layerSize.y"
                        id="layer-y"
                    />
                </label>
            </div>
        </template>
        <div class="form-control flex flex-row">
            <!-- resampling type select -->
            <label
                class="label w-full"
                for="image-resampling"
            >
                <div class="w-1/3">Resampling</div>
                <select
                    id="image-resampling"
                    class="select select-sm select-bordered ml-2 w-2/3"
                    v-model="options.resampling"
                >
                    <option
                        v-for="(p, idx) in resamplingTypes"
                        :key="idx"
                        :value="p"
                    >
                        {{ p }}
                    </option>
                </select>
            </label>
        </div>
        <div class="form-control flex flex-row">
            <!-- brightness -->
            <label
                class="label w-full"
                for="image-brightness"
            >
                <div class="w-1/3">Brightness</div>
                <input
                    class="range range-sm range-primary ml-2 w-2/3"
                    type="range"
                    min="-100"
                    max="100"
                    step="10"
                    v-model="options.brightness"
                    id="image-brightness"
                    @dblclick="resetBrightness"
                />
                <span class="ml-2 w-10">{{ options.brightness }}%</span>
            </label>
        </div>
        <div class="form-control flex flex-row">
            <!-- contrast -->
            <label
                class="label w-full"
                for="image-contrast"
            >
                <div class="w-1/3">Contrast</div>
                <input
                    class="range range-sm range-primary ml-2 w-2/3"
                    type="range"
                    min="-100"
                    max="100"
                    step="10"
                    v-model="options.contrast"
                    id="image-contrast"
                    @dblclick="resetContrast"
                />
                <span class="ml-2 w-10">{{ options.contrast }}%</span>
            </label>
        </div>
        <div class="form-control flex gap-0">
            <!-- grayscalte first -->
            <label class="cursor-pointer label">
                <span class="">Grayscale first</span>
                <input
                    type="checkbox"
                    class="toggle toggle-primary"
                    v-model="options.grayscale"
                />
            </label>
            <!-- dither -->
            <label class="cursor-pointer label">
                <span class="">Dithering</span>
                <input
                    type="checkbox"
                    class="toggle toggle-primary"
                    v-model="options.dither"
                />
            </label>
            <!-- invert palette -->
            <label class="cursor-pointer label">
                <span class="">Invert palette</span>
                <input
                    type="checkbox"
                    class="toggle toggle-primary"
                    v-model="options.invertPalette"
                />
            </label>
            <!-- invert -->
            <label class="cursor-pointer label">
                <span class="">Invert result</span>
                <input
                    type="checkbox"
                    class="toggle toggle-primary"
                    v-model="options.invert"
                />
            </label>
        </div>
    </div>
</template>
<style lang="css" scoped>
.canvasContainer,
canvas {
    /* position: absolute; */
    background-color: black;
    /* left: 50%;
    top: 50%;
    transform: translate(-50%, -50%); */
    image-rendering: pixelated;
    margin: auto;
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
        display: v-bind(gridDisplay);
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
    border: 1px solid #2196f3;
}

.crop .crop-nw {
    top: -5px;
    left: -5px;
    cursor: nw-resize;
}

.crop .crop-ne {
    top: -5px;
    right: -5px;
    cursor: ne-resize;
}

.crop .crop-sw {
    bottom: -5px;
    left: -5px;
    cursor: sw-resize;
}

.crop .crop-se {
    bottom: -5px;
    right: -5px;
    cursor: se-resize;
}
</style>
