<script lang="ts" setup>
import {ref, Teleport} from 'vue';
import ImageEditor from './ImageEditor.vue';
import Button from '/src/components/layout/Button.vue';
import {
    debounce,
    imageDataToImage,
    loadImageAsync,
    logEvent,
    readFileAsync,
    toCppVariableName,
    xbmpToImgData,
} from '/src/utils';

const emit = defineEmits(['onClose', 'onSave']);

const editorRef = ref(null);
const sourceImages = ref([]);
const isWizardDisabled = ref(false);
const activeImage = ref();
const imageType = ref('file');
const isLoading = ref(false);
const dragenter = ref(false);
const bitmapData = ref();
const bitmapImage = ref(null);
const width = ref(128);
const height = ref(64);
const swapBytes = ref(false);

function cancel() {
    emit('onClose');
}

function selectImage(name, image) {
    editorRef.value.setImage(name, image);
    activeImage.value = name;
}

async function onFileChange(e) {
    isLoading.value = true;

    const files = e.target?.files ?? e.dataTransfer?.files;
    await handleImages(files);
}

async function handleImages(files) {
    const images = [];
    for (const file of files) {
        const name = toCppVariableName(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
        const fileResult = await readFileAsync(file);
        const image = await loadImageAsync(fileResult);
        images.push([name, image]);
    }
    setImagesPreview(images);
}

function setImagesPreview(images: [string, HTMLImageElement][]) {
    sourceImages.value = images;
    editorRef.value.setImage(images[0][0], images[0][1]);
    activeImage.value = images[0][0];
}

async function processImages() {
    isWizardDisabled.value = true;
    const processedImagesArr = [];
    for (const [name, image] of sourceImages.value) {
        const [imageProcessed, width, height] = await editorRef.value.process(image);
        processedImagesArr.push([name, width, height, imageProcessed]);
    }
    emit('onSave', processedImagesArr);
}

const previewBitmap = debounce(async () => {
    if (bitmapData.value && width.value && height.value) {
        const imageData = xbmpToImgData(
            bitmapData.value,
            Math.abs(width.value),
            Math.abs(height.value),
            swapBytes.value
        );
        bitmapImage.value = await imageDataToImage(imageData);
    }
}, 500);

function importBitmap() {
    isWizardDisabled.value = true;
    emit('onSave', [['imgbitmap.png', width.value, height.value, bitmapImage.value]]);
}

defineExpose({
    setImagesPreview,
});
</script>
<template>
    <Teleport to="body">
        <div class="modal font-sans text-white opacity-100 pointer-events-auto">
            <div
                v-if="isWizardDisabled"
                class="fixed top-1/2 z-50 text-center"
            >
                <div class="loading loading-spinner text-primary"></div>
                <div>Processing image(s)...</div>
            </div>
            <div
                class="modal-box mb-20 border border-primary max-w-[1100px] pointer-events-auto opacity-100"
                :class="{
                    'pointer-events-none blur-sm': isWizardDisabled,
                }"
                v-show="sourceImages.length === 0"
            >
                <button
                    class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    @click="cancel"
                >
                    ✕
                </button>
                <fieldset>
                    <div class="flex flex-row gap-4 mb-2">
                        <label class="label cursor-pointer">
                            <input
                                type="radio"
                                name="import-type"
                                class="radio radio-sm radio-primary"
                                value="file"
                                v-model="imageType"
                            />
                            <span class="label-text ml-2">Upload file</span>
                        </label>
                        <label class="label cursor-pointer">
                            <input
                                type="radio"
                                name="import-type"
                                class="radio radio-sm radio-primary"
                                value="bitmap"
                                v-model="imageType"
                                @change="logEvent(`button_import_type_bitmap`)"
                            />
                            <span class="label-text ml-2">Input byte array</span>
                        </label>
                    </div>
                </fieldset>
                <template v-if="imageType === 'file'">
                    <div
                        class="border border-success border-dashed rounded-lg text-center py-32"
                        :class="{
                            'bg-secondary': dragenter,
                        }"
                        @drop.prevent="onFileChange"
                        @dragover.prevent="dragenter = true"
                        @dragleave.prevent="dragenter = false"
                    >
                        <p>Choose files or drag & drop them here</p>
                        <label
                            class="mt-4 mx-auto btn btn-sm btn-outline btn-success uppercase font-sans overflow-hidden"
                        >
                            <input
                                type="file"
                                style="position: fixed; top: -100%"
                                accept="image/*"
                                @change="onFileChange"
                                ref="fileInput"
                                multiple
                                :disabled="isLoading"
                            />
                            Browse files
                            <div
                                v-if="isLoading"
                                class="loading loading-sm loading-spinner"
                            ></div>
                        </label>
                    </div>
                </template>
                <template v-if="imageType === 'bitmap'">
                    <div class="flex gap-4 items-start">
                        <div class="form-control w-1/2">
                            <textarea
                                class="textarea textarea-bordered"
                                placeholder="Paste the byte array here. Example: 0x0A, 0x0B, 0x09"
                                v-model="bitmapData"
                                @input="previewBitmap"
                                rows="12"
                            ></textarea>
                        </div>
                        <div class="w-1/2">
                            <div class="flex gap-4">
                                <label class="label">
                                    Width:
                                    <input
                                        class="input input-sm input-bordered w-20 ml-2"
                                        type="number"
                                        min="1"
                                        v-model="width"
                                        @input="previewBitmap"
                                    />
                                </label>

                                <label class="label">
                                    Height:
                                    <input
                                        class="input input-sm input-bordered w-20 ml-2"
                                        type="number"
                                        min="1"
                                        v-model="height"
                                        @input="previewBitmap"
                                    />
                                </label>

                                <label class="label">
                                    <input
                                        type="checkbox"
                                        class="checkbox checkbox-sm checkbox-primary mr-2"
                                        v-model="swapBytes"
                                        @change="previewBitmap"
                                        @input="logEvent(`button_import_bitmap_swap_bytes`)"
                                    />
                                    Swap bytes
                                </label>
                            </div>
                            <div
                                v-if="bitmapImage"
                                class="mt-4"
                            >
                                <img
                                    :src="bitmapImage.src"
                                    class="object-contain w-auto h-64 mx-auto border border-secondary"
                                />
                            </div>
                        </div>
                    </div>
                </template>
                <div class="col-span-2 flex flex-row justify-between mt-4">
                    <Button
                        @click="cancel"
                        danger
                    >
                        Cancel
                    </Button>
                    <Button
                        @click="importBitmap"
                        :success="true"
                        v-if="bitmapImage"
                    >
                        Import
                    </Button>
                </div>
            </div>
            <div
                v-show="sourceImages.length > 0"
                class="modal-box mb-20 border border-primary max-w-none pointer-events-auto opacity-100"
                :class="{
                    'pointer-events-none blur-sm': isWizardDisabled,
                    'w-[1200px]': sourceImages.length > 1,
                    'w-[900px]': sourceImages.length <= 1,
                }"
            >
                <button
                    class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    @click="cancel"
                >
                    ✕
                </button>
                <div class="flex flex-row gap-4">
                    <div
                        v-if="sourceImages.length > 1"
                        class="w-[30%]"
                    >
                        <div class="label">Images</div>
                        <div class="max-h-[500px] overflow-scroll flex flex-wrap gap-4">
                            <div
                                class="cursor-pointer border-2 border-base-300 bg-base-300 rounded p-2"
                                :class="{
                                    'border-primary': name === activeImage,
                                }"
                                v-for="[name, image] in sourceImages"
                                @click="selectImage(name, image)"
                            >
                                <img
                                    :src="image.src"
                                    :alt="name"
                                    class="object-contain max-h-16"
                                />
                            </div>
                        </div>
                    </div>
                    <ImageEditor
                        ref="editorRef"
                        :single="sourceImages.length <= 1"
                    />
                </div>
                <div class="col-span-2 flex flex-row justify-between mt-4">
                    <Button
                        @click="cancel"
                        danger
                    >
                        Cancel
                    </Button>
                    <Button
                        @click="processImages"
                        :success="true"
                    >
                        Import
                    </Button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
<style lang="css" scoped>
img {
    image-rendering: pixelated;
}
</style>
