<script lang="ts" setup>
import {Teleport, nextTick, reactive, ref, toRefs, watch} from 'vue';
import {processImage, imageDataToImage, imageToImageData, applyColor} from '../../utils';
const props = defineProps<{
    visible: boolean;
}>();

const emit = defineEmits(['onClose', 'onSave']);
const canvasRef = ref(null);
const imageName = ref('');
const options = reactive({
    dither: true,
    invert: false,
    width: 0,
    height: 0,
    proportion: 1,
    alpha: true,
    palette: ['#000000', '#FFFFFF']
});
const {proportion} = toRefs(options);

const width = ref(0);
const height = ref(0);

const scale = ref(1);
const scales = [1, 2, 3, 4, 5];
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

watch([options, scale], () => {
    preview();
});

function setImage(sourvceImage: HTMLImageElement, name: string) {
    imageName.value = name;
    imageData = imageToImageData(sourvceImage);
    image = sourvceImage;
    options.width = image.width;
    options.height = image.height;
    width.value = image.width;
    height.value = image.height;
    options.proportion = image.width / image.height;
    preview();
}

function preview() {
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');
    canvas.width = options.width;
    canvas.height = options.height;
    canvas.style.width = options.width * scale.value + 'px';
    canvas.style.height = options.height * scale.value + 'px';
    // const imageData = processImage(image, options);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(processImage(imageData, options), 0, 0);
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
                <canvas ref="canvasRef" style="width: 100%; height: 100%"></canvas>
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
                <!-- dither -->
                <label class="fui-form-label fui-form-column" for="image-dithering">
                    Dithering:
                    <input class="fui-form-checkbox" type="checkbox" v-model="options.dither" id="image-dithering" />
                </label>

                <!-- invert -->
                <label class="fui-form-label fui-form-column" for="image-invert">
                    Inverting:
                    <input class="fui-form-checkbox" type="checkbox" v-model="options.invert" id="image-invert" />
                </label>
            </div>

            <div class="buttons-bottom">
                <button class="button button_danger fui-display-custom-dialog__cancel" @click="cancel">Cancel</button>
                <button class="button fui-display-custom-dialog__save" @click="preview">Preview</button>
                <button class="button fui-display-custom-dialog__save" @click="save">Import</button>
            </div>
        </div>
    </Teleport>
</template>
<style lang="css" scoped>
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
</style>
