<script lang="ts" setup>
import {Teleport, nextTick, reactive, ref, toRefs, watch} from 'vue';
import {processImage, imageDataToImage, imageToImageData, applyColor, debounce} from '../../utils';
import {useSession} from '../../core/session';
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

const debouncedPreview = debounce(preview, 250);
watch([options, scale], () => {
    debouncedPreview();
});

function setImage(sourvceImage: HTMLImageElement, name: string) {
    // reset options
    options.brightness = 0;
    options.contrast = 0;
    options.dither = true;
    options.invert = false;
    options.resampling = 'nearest';
    scale.value = 1;
    //
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
    width.value = options.width;
    height.value = options.height;
    scale.value = 2;
    preview();
}

function preview() {
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

function cancel() {
    emit('onClose');
}

function save() {
    imageDataToImage(applyColor(processImage(imageData, options), '#000000')).then((img) => {
        emit('onSave', img, imageName.value);
    });
}

defineExpose({
    setImage
});
</script>
<template>
    <Teleport to="body">
        <div class="fui-import-wizard-dialog" :class="{visible}">
            <div class="fui-form-row fui-form-header">Image preview</div>
            <div class="fui-form-row fui-import-wizard-canvas-wrapper" style="width: 400px; height: 300px">
                <canvas ref="canvasRef" class="grid"></canvas>
            </div>
            <div class="fui-form-row">
                <!-- image name -->
                <label class="fui-form-label fui-form-column" for="image-name">
                    Name:
                    <input class="fui-form-input" type="text" v-model="imageName" id="image-name" />
                </label>
                <label class="fui-form-label fui-form-column" for="image-zoom">Zoom:</label>
                <select id="image-zoom" class="fui-select__select fui-form-input" v-model="scale">
                    <option v-for="(p, idx) in scales" :key="idx" :value="p">{{ p * 100 }}%</option>
                </select>
            </div>

            <div class="fui-form-row">
                <label class="fui-form-label fui-form-column" for="image-width">
                    Width:
                    <input class="fui-form-input fui-form-input__size" type="number" v-model="width" id="image-width" />
                </label>

                <label class="fui-form-label fui-form-column" for="image-height">
                    Height:
                    <input
                        class="fui-form-input fui-form-input__size"
                        type="number"
                        min="1"
                        v-model="height"
                        id="image-height"
                    />
                </label>
            </div>
            <div class="fui-form-row">
                <!-- resampling type select -->
                <label class="fui-form-label fui-form-column" for="image-resampling">Resampling algorithm:</label>
                <select id="image-resampling" class="fui-select__select fui-form-input" v-model="options.resampling">
                    <option v-for="(p, idx) in resamplingTypes" :key="idx" :value="p">{{ p }}</option>
                </select>
            </div>
            <div class="fui-form-row">
                <!-- reset -->
                <button
                    class="button"
                    style="margin-left: 8px"
                    @click="
                        width = image.width;
                        height = image.height;
                    "
                >
                    Reset size
                </button>
                <button class="button" style="margin-left: 8px" @click="fitToScreen">Fit to screen</button>
            </div>
            <div class="fui-form-row">
                <!-- brightness -->
                <label class="fui-form-label fui-form-column" for="image-brightness">
                    Brightness:
                    <input
                        class="fui-form-input fui-form-input__size"
                        type="number"
                        min="-100"
                        max="100"
                        v-model="options.brightness"
                        id="image-brightness"
                    />
                </label>
                <!-- contrast -->
                <label class="fui-form-label fui-form-column" for="image-contrast">
                    Contrast:
                    <input
                        class="fui-form-input fui-form-input__size"
                        type="number"
                        min="-100"
                        max="100"
                        v-model="options.contrast"
                        id="image-contrast"
                    />
                </label>
            </div>
            <div class="fui-form-row">
                <!-- dither -->
                <label class="fui-form-label fui-form-column" for="image-dithering">
                    Dithering:
                    <input class="fui-form-checkbox" type="checkbox" v-model="options.dither" id="image-dithering" />
                </label>
                <!-- invert palette -->
                <label class="fui-form-label fui-form-column" for="image-invert-palette">
                    Invert palette:
                    <input
                        class="fui-form-checkbox"
                        type="checkbox"
                        v-model="options.invertPalette"
                        id="image-invert-palette"
                    />
                </label>
                <!-- invert -->
                <label class="fui-form-label fui-form-column" for="image-invert">
                    Inverting:
                    <input class="fui-form-checkbox" type="checkbox" v-model="options.invert" id="image-invert" />
                </label>
            </div>

            <div class="buttons-bottom">
                <button class="button button_danger fui-display-custom-dialog__cancel" @click="cancel">Cancel</button>
                <button class="button fui-display-custom-dialog__save" @click="save">Import</button>
            </div>
        </div>
    </Teleport>
</template>
<style lang="css" scoped>
.grid {
    position: relative;
    &::after {
        content: '';
        position: absolute;
        inset: 0;
        background-image: linear-gradient(to right, #000000 0.1px, transparent 0.5px),
            linear-gradient(to bottom, #000000 0.1px, transparent 0.5px);
        background-size: v-bind(scale) + 'px ' + v-bind(scale) + 'px';
        opacity: 0.6;
        z-index: 1;
    }
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
.fui-import-wizard-canvas-wrapper canvas {
    position: absolute;
    background-color: black;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    image-rendering: pixelated;
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
</style>
