<script
    lang="ts"
    setup
>
import { ref, Teleport, onMounted, onUnmounted, watch, computed, toRefs } from 'vue';
import ImageEditor from './ImageEditor.vue';
import Button from '/src/components/layout/Button.vue';
import { useSession } from '/src/core/session';
import { iconsList } from '/src/icons/icons';
import {
    debounce,
    extractGifFrames,
    imageDataToImage,
    loadImageAsync,
    logEvent,
    readFileAsync,
    toCppVariableName,
    xbmpToImgData,
} from '/src/utils';

const emit = defineEmits(['onClose', 'onSave', 'onIconSelect']);
const session = useSession();
const { customImages } = toRefs(session.state);

const customImagesSorted = computed(() => {
    return [...customImages.value].sort((a, b) => a.id - b.id);
});

function removeImage(image) {
    customImages.value = customImages.value.filter((img) => img.name !== image.name);
}

function iconClick(e, item) {
    const data = {
        name: item.name,
        width: item.width,
        height: item.height,
        icon: e.target,
        colorMode: item.colorMode,
    };
    emit('onIconSelect', data);
}

const editorRef = ref(null);
const sourceImages = ref([]);
const selectedImages = ref(new Set());
const isWizardDisabled = ref(false);
const activeImage = ref();
const imageType = ref('icons');
const isLoading = ref(false);
const dragenter = ref(false);
const bitmapData = ref();
const bitmapImage = ref(null);

const width = ref(128);
const height = ref(64);
const swapBytes = ref(false);
// Detect RGB capability to drive color mode behavior.
const isPlatformColored = computed(() => {
    const features = session.getPlatformFeatures(session.state.platform);
    return Boolean(features?.hasRGBSupport);
});
// Respect monochrome support so RGB-only platforms stay in RGB.
const supportsMonochrome = computed(() => {
    const features = session.getPlatformFeatures(session.state.platform);
    return features?.hasMonochromeSupport ?? true;
});
// Default to RGB when monochrome is disabled on an RGB platform.
const colorMode = ref<'rgb' | 'monochrome'>(
    isPlatformColored.value && !supportsMonochrome.value ? 'rgb' : 'monochrome'
);
// Expose RGB toggle only when monochrome is available.
const canToggleRgbMode = computed(() => isPlatformColored.value && supportsMonochrome.value);

watch([supportsMonochrome, isPlatformColored], ([supportsMono, supportsRgb]) => {
    // Lock RGB mode when monochrome is disabled.
    if (supportsRgb && !supportsMono) {
        colorMode.value = 'rgb';
        return;
    }
    // Guard against RGB on monochrome-only platforms.
    if (!supportsRgb && colorMode.value === 'rgb') {
        colorMode.value = 'monochrome';
    }
});

function restoreBitmapDimensions() {
    if (typeof window === 'undefined') {
        return;
    }

    const storedWidth = localStorage.getItem('lopaka_import_bitmap_width');
    const storedHeight = localStorage.getItem('lopaka_import_bitmap_height');
    const storedSwapBytes = localStorage.getItem('lopaka_import_bitmap_swap_bytes');

    if (storedWidth !== null) {
        const parsedWidth = Number.parseInt(storedWidth, 10);
        if (!Number.isNaN(parsedWidth)) {
            width.value = parsedWidth;
        }
    }

    if (storedHeight !== null) {
        const parsedHeight = Number.parseInt(storedHeight, 10);
        if (!Number.isNaN(parsedHeight)) {
            height.value = parsedHeight;
        }
    }

    if (storedSwapBytes !== null) {
        swapBytes.value = storedSwapBytes === 'true';
    }
}

function persistBitmapSize(key: string, value: string | number) {
    if (typeof window === 'undefined') {
        return;
    }

    const numericValue = Number.parseInt(`${value}`, 10);

    if (Number.isNaN(numericValue)) {
        localStorage.removeItem(key);
        return;
    }

    localStorage.setItem(key, numericValue.toString());
}

function persistBitmapFlag(key: string, value: boolean) {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.setItem(key, value ? 'true' : 'false');
}

watch(imageType, (type) => {
    if (type === 'bitmap') {
        restoreBitmapDimensions();
    }
});

watch(width, (newWidth) => {
    persistBitmapSize('lopaka_import_bitmap_width', newWidth);
});

watch(height, (newHeight) => {
    persistBitmapSize('lopaka_import_bitmap_height', newHeight);
});

watch(swapBytes, (newSwapBytes) => {
    persistBitmapFlag('lopaka_import_bitmap_swap_bytes', newSwapBytes);
});

function cancel() {
    emit('onClose');
}

function selectImage(name, image) {
    editorRef.value.setImage(name, image);
    activeImage.value = name;
}

function toggleImageSelection(name) {
    if (selectedImages.value.has(name)) {
        selectedImages.value.delete(name);
    } else {
        selectedImages.value.add(name);
    }
}

function isImageSelected(name) {
    return selectedImages.value.has(name);
}

function selectAllImages() {
    selectedImages.value = new Set(sourceImages.value.map(([name]) => name));
}

async function onFileChange(e) {
    isLoading.value = true;

    const files = e.target?.files ?? e.dataTransfer?.files;
    await handleImages(files);
}

async function handleImages(files) {
    const images = [];
    for (const file of files) {
        const fileName = file.name.toLowerCase();
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

        // Check if it's a GIF file
        if (fileName.endsWith('.gif')) {
            try {
                const frames = await extractGifFrames(file);
                // Process each frame as a separate image
                for (let i = 0; i < frames.length; i++) {
                    const frameName =
                        frames.length > 1
                            ? `${toCppVariableName(baseName)}_frame_${i + 1}`
                            : toCppVariableName(baseName);
                    images.push([frameName, frames[i]]);
                }
            } catch (error) {
                console.error('Failed to extract GIF frames:', error);
                // Fallback to regular image loading
                const fileResult = await readFileAsync(file);
                const image = await loadImageAsync(fileResult);
                images.push([toCppVariableName(baseName), image]);
            }
        } else {
            // Regular image file
            const name = toCppVariableName(baseName);
            const fileResult = await readFileAsync(file);
            const image = await loadImageAsync(fileResult);
            images.push([name, image]);
        }
    }
    setImagesPreview(images);
}

function setImagesPreview(images: [string, HTMLImageElement][]) {
    sourceImages.value = images;
    // Initialize all images as selected by default
    selectedImages.value = new Set(images.map(([name]) => name));
    editorRef.value.setImage(images[0][0], images[0][1]);
    activeImage.value = images[0][0];
}

async function processImages() {
    isWizardDisabled.value = true;
    const processedImagesArr = [];
    for (const [name, image] of sourceImages.value) {
        // Only process selected images
        if (selectedImages.value.has(name)) {
            const [imageProcessed, width, height] = await editorRef.value.process(image);
            processedImagesArr.push([name, width, height, imageProcessed, colorMode.value]);
        }
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
    // Keep bitmap imports monochrome unless the platform disables monochrome.
    const bitmapColorMode = isPlatformColored.value && !supportsMonochrome.value ? 'rgb' : 'monochrome';
    emit('onSave', [['imgbitmap.png', width.value, height.value, bitmapImage.value, bitmapColorMode]]);
}

function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        cancel();
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
});

defineExpose({
    setImagesPreview,
});
</script>
<template>
    <Teleport to="body">
        <div
            class="modal font-sans text-white opacity-100 pointer-events-auto"
            @mousedown.self="cancel"
        >
            <div
                v-if="isWizardDisabled"
                class="fixed top-1/2 z-50 text-center"
            >
                <div class="loading loading-spinner text-primary"></div>
                <div>Processing image(s)...</div>
            </div>
            <div
                class="modal-box mb-20 border border-base-300 max-w-[1100px] pointer-events-auto opacity-100"
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
                                value="icons"
                                v-model="imageType"
                            />
                            <span class="label-text ml-2">Icon Packs</span>
                        </label>
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
                <template v-if="imageType === 'icons'">
                    <div class="icon-packs-grid bg-neutral rounded-md overflow-y-auto p-2" style="max-height: 400px;">
                        <details
                            open
                            v-if="customImages.length"
                        >
                            <summary class="cursor-pointer pb-2 text-white">Current Project</summary>
                            <div class="flex flex-row flex-wrap pb-4">
                                <div
                                    class="relative image-custom"
                                    v-for="(item, index) in customImagesSorted"
                                    :key="index"
                                >
                                    <img
                                        @click="iconClick($event, item)"
                                        :src="item.image.src"
                                        :data-name="item.name"
                                        :data-color-mode="item.colorMode"
                                        :width="item.width * 2"
                                        :height="item.height * 2"
                                        :data-w="item.width"
                                        :data-h="item.height"
                                        :alt="item.name"
                                        :title="item.name"
                                        crossorigin="anonymous"
                                        class="object-contain p-4 box-content image-custom-inner max-h-16 cursor-pointer"
                                    />
                                    <div class="absolute -right-2 -top-2 hidden image-custom-remove">
                                        <span
                                            class="btn btn-circle btn-xs btn-round text-error"
                                            @click="removeImage(item)"
                                            title="Delete"
                                        >
                                            ×
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </details>
                        <details
                            v-for="(value, key) in iconsList"
                            :key="key"
                            open
                        >
                            <summary class="cursor-pointer pb-2 text-white">{{ value.title }}</summary>
                            <div class="flex flex-row flex-wrap">
                                <div
                                    v-for="(item, index) in iconsList[key].icons"
                                    :key="index"
                                >
                                    <img
                                        @click="iconClick($event, item)"
                                        :src="item.image"
                                        :data-name="item.name"
                                        :data-w="item.width"
                                        :data-h="item.height"
                                        :width="item.width * 2"
                                        :height="item.height * 2"
                                        :alt="item.name"
                                        :title="item.name"
                                        class="object-contain invert p-4 box-content hover:bg-gray-300 cursor-pointer max-w-[128px]"
                                    />
                                </div>
                            </div>
                        </details>
                    </div>
                </template>
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
                                accept="image/*,.gif"
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
                        v-if="imageType === 'bitmap' && bitmapImage"
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
                    class="btn btn-sm btn-circle btn-ghost absolute right-1 top-1"
                    @click="cancel"
                >
                    ✕
                </button>
                <div class="flex flex-row gap-4">
                    <div
                        v-if="sourceImages.length > 1"
                        class="w-[30%]"
                    >
                        <div class="label pb-0 flex justify-between items-center">
                            <span>
                                Images
                                {{ selectedImages.size > 0 ? `(${selectedImages.size})` : '' }}
                            </span>
                            <span
                                v-if="selectedImages.size < sourceImages.length"
                                class="text-primary cursor-pointer hover:underline text-sm"
                                @click="selectAllImages"
                            >
                                Select all
                            </span>
                        </div>
                        <div class="max-h-[500px] overflow-scroll flex flex-wrap gap-4 pt-2">
                            <div
                                class="cursor-pointer border-2 border-base-300 bg-base-300 rounded p-2 relative group"
                                :class="{
                                    'border-primary': name === activeImage,
                                }"
                                v-for="[name, image] in sourceImages"
                                @click="selectImage(name, image)"
                            >
                                <input
                                    type="checkbox"
                                    class="checkbox checkbox-xs checkbox-primary absolute -top-2 -right-2 z-10 bg-neutral"
                                    :class="{
                                        'opacity-100': isImageSelected(name),
                                        'opacity-0 group-hover:opacity-100': !isImageSelected(name),
                                    }"
                                    :checked="isImageSelected(name)"
                                    @click.stop="toggleImageSelection(name)"
                                />
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
                        :colorMode="colorMode"
                        :can-use-rgb="canToggleRgbMode"
                        @update:colorMode="colorMode = $event"
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
                        :disabled="selectedImages.size === 0"
                    >
                        Import
                    </Button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
<style
    lang="css"
    scoped
>
img {
    image-rendering: pixelated;
}

.icon-packs-grid img {
    cursor: pointer;
    display: block;
}

.image-custom:hover .image-custom-inner {
    background-color: oklch(var(--s));
}

.image-custom:hover .image-custom-remove {
    display: block;
}
</style>
