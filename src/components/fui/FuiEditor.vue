<script
    setup
    lang="ts"
>
import { computed, onBeforeUnmount, onMounted, ref, ShallowRef, toRefs, watch } from 'vue';
import { Project, ProjectScreen } from '/src/types';
import Button from '/src/components/layout/Button.vue';
import FuiCanvas from '/src/components/fui/FuiCanvas.vue';
import FuiCode from '/src/components/fui/FuiCode.vue';
import FuiEditorSettings from '/src/components/fui/FuiCodeSettings.vue';
import ImportFile from '/src/components/fui/ImportFile.vue';
import Inspector from '/src/components/fui/inspector/Inspector.vue';
import FuiSelectDisplay from '/src/components/fui/FuiSelectDisplay/FuiSelectDisplay.vue';
import FuiSelectPlatform from '/src/components/fui/FuiSelectPlatform.vue';
import FuiSelectScale from '/src/components/fui/FuiSelectScale.vue';
import FuiTools from '/src/components/fui/FuiTools.vue';
import PaintBrushColorInput from './PaintBrushColorInput.vue';
import PaintColorModeToggle from './PaintColorModeToggle.vue';
import Icon from '/src/components/layout/Icon.vue';
import FuiSelectColors from './FuiSelectColors.vue';
import ImportImageWizard from './importImage/ImportImageWizard.vue';

import { Point } from '/src/core/point';
import { saveLayers, useSession } from '/src/core/session';
import { FlipperRPC } from '/src/flipper-rpc';
import { FlipperPlatform } from '/src/platforms/flipper';
import { logEvent } from '/src/utils';
import { PaintLayer } from '/src/core/layers/paint.layer';
import { Uint32RawPlatform } from '/src/platforms/uint32-raw';
import { FreestylePlatform } from '/src/platforms/freestyle';
import { U8g2Platform } from '/src/platforms/u8g2';
import { addCustomImage } from '/src/core/session';
import { createScreenAutosave } from '/src/core/screen-autosave';

const props = defineProps<{
    project: Project | null;
    screen: ProjectScreen | null | undefined;
    readonly?: boolean;
    isScreenNotFound: boolean;
    isScreenLoaded: boolean;
}>();

const emit = defineEmits(['openPresenter', 'setInfoMessage', 'setErrorMessage']);

const session = useSession();
const { virtualScreen, state, platforms } = session;
const { platform, warnings } = toRefs(state);
const { immidiateUpdates } = toRefs(session.state);
const flipper: ShallowRef<FlipperRPC> = ref(null);
const uploading = ref(false);
const { activeTool, activeLayer } = toRefs(session.editor.state);

const isFlipper = computed(() => platform.value === FlipperPlatform.id);
const isSerialSupported = computed(() => window.navigator.serial !== undefined);
const flipperPreviewBtnText = computed(() => (flipper.value ? 'Disconnect' : 'Live View'));
const isPlatformWithParser = computed(() => platforms[platform.value].hasParser());
const platformFeatures = computed(() => session.getPlatformFeatures(platform.value));
const isPlatformColored = computed(() => Boolean(platformFeatures.value?.hasRGBSupport));
// Respect monochrome support flag for platforms that disable it.
const supportsMonochrome = computed(() => platformFeatures.value?.hasMonochromeSupport ?? true);
const isPaintToolActive = computed(() => activeTool.value?.getName() === 'paint');
const supportsRgbBrushes = computed(() => {
    const features = platformFeatures.value;
    return Boolean(features?.hasRGBSupport);
});
// Hide the color mode toggle when monochrome isn't supported.
const showColorModeToggle = computed(
    () => activeTool.value?.getName() === 'paint' && isPlatformColored.value && supportsMonochrome.value
);
const shouldShowBrushControls = computed(() => {
    if (!supportsRgbBrushes.value) {
        return false;
    }
    return isPaintToolActive.value && session.state.paintColorMode === 'rgb';
});
// Keep autosave tied to the screen id captured at edit time.
const screenAutosave = createScreenAutosave(1000);

watch(immidiateUpdates, (newValue, oldValue) => {
    // Capture the current id so delayed writes cannot target another screen.
    const capturedScreenId = props.screen.id;
    // Capture layers immediately so delayed tasks do not read another screen state later.
    const capturedLayers = session.layersManager.layers.map((layer) => layer.state);
    // Capture preview immediately so delayed updates keep the right thumbnail.
    const capturedPreview = session.virtualScreen.canvas.toDataURL();
    // Debounce autosave while preserving the captured screen id.
    screenAutosave.schedule({
        screenId: capturedScreenId,
        run: (screenId) => {
            // Keep Flipper preview behavior unchanged for autosave events.
            if (flipper.value) {
                sendFlipperImage();
            }
            // Persist the captured snapshot for the exact screen that changed.
            saveLayers(screenId, { layers: capturedLayers, imagePreview: capturedPreview });
            // Refresh only the matching screen thumbnail with the captured preview.
            updateScreenPreview(screenId, capturedPreview);
        },
    });
});
watch(
    () => props.screen?.id,
    (newScreenId, previousScreenId) => {
        // Flush pending autosave before switching context to another screen.
        if (previousScreenId && previousScreenId !== newScreenId) {
            screenAutosave.flush();
        }
    }
);

watch(warnings, () => {
    setWarnings(session.state.warnings);
});

onMounted(() => {
    navigator.serial?.addEventListener('disconnect', flipperDisconnect);
});

onBeforeUnmount(() => {
    // Flush pending autosave so recent edits are not dropped on navigation.
    screenAutosave.flush();
    navigator.serial?.removeEventListener('disconnect', flipperDisconnect);
    handleWizardClose();
});

// Handle wizard save from session
async function handleWizardSave(processedImagesArr) {
    try {
        for (const [name, width, height, image, colorMode] of processedImagesArr) {
            addCustomImage(name, width, height, image, false, undefined, colorMode);
            handleIconSelect({
                name, width, height, icon: image, colorMode
            })
        }
        session.closeImageWizard();
    } catch (error) {
        console.error('Error saving images:', error);
        session.closeImageWizard();
    }
}

function handleWizardClose() {
    session.closeImageWizard();
}

function handleIconSelect(data) {
    session.layersManager.clearSelection();
    const newLayer = new PaintLayer(session.getPlatformFeatures(), session.createRenderer(), data.colorMode);
    newLayer.name = data.name;
    newLayer.size = new Point(data.width, data.height);
    session.layersManager.selectLayer(newLayer);
    data.icon.dataset.name ||= data.name;
    data.icon.dataset.colorMode ||= data.colorMode;
    data.icon.dataset.w ||= `${data.width}`;
    data.icon.dataset.h ||= `${data.height}`;
    newLayer.modifiers.icon.setValue(data.icon);
    const display = session.state.display;
    newLayer.position = new Point(
        Math.floor(display.x / 2 - data.width / 2),
        Math.floor(display.y / 2 - data.height / 2)
    );
    newLayer.updateBounds();
    newLayer.stopEdit();
    session.addLayer(newLayer);
    virtualScreen.redraw();
    session.editor.setTool(null);
    session.closeImageWizard();
}

async function toggleFlipperPreview() {
    if (flipper.value) {
        logEvent('button_flipper', 'disconnect');
        flipperDisconnect();
    } else {
        logEvent('button_flipper', 'connect');
        const flipperRPC = new FlipperRPC();
        const isConnected = await flipperRPC.connect();
        if (isConnected) {
            flipper.value = flipperRPC;
            if (immidiateUpdates.value) {
                sendFlipperImage();
            }
        }
    }
}

function flipperDisconnect() {
    flipper.value.disconnect();
    flipper.value = null;
}

function sendFlipperImage() {
    flipper.value.sendImage(virtualScreen.canvasContext.getImageData(0, 0, 128, 64));
}

function updateScreenPreview(screen_id, imagePreview) {
    if (!props.project.screens) return;
    props.project.screens = props.project.screens.map((item) => {
        if (item && item?.id === screen_id) {
            item.img_preview = imagePreview;
        }
        return item;
    });
}

function copyCode() {
    navigator.clipboard.writeText(session.generateCode().code).then(() => {
        emit('setInfoMessage', 'Copied to clipboard');
    });
    logEvent('button_copy');
}

function setWarnings(warnings) {
    warnings.forEach((warning, idx) => {
        setTimeout(() => warnings.shift(), 3000 * (1 + idx));
    });
}

function onMouseClick() {
    session.layersManager.clearSelection();
    session.virtualScreen.redraw();
}
</script>

<template>
    <!-- Image Wizard Modal -->
    <ImportImageWizard
        v-if="session.state.imageWizard.isOpen"
        @onClose="handleWizardClose"
        @onSave="handleWizardSave"
        @onIconSelect="handleIconSelect"
    />

    <div class="toast toast-top toast-center z-50">
        <div
            class="alert alert-info"
            v-if="uploading"
        >
            <span>Uploading images. Please wait...</span>
            <div class="loading"></div>
        </div>
        <slot name="messages"></slot>
        <template v-if="warnings.length">
            <div
                v-for="(warningMessage, idx) in warnings"
                class="alert alert-warning"
                :key="idx"
            >
                <span>{{ warningMessage }}</span>
            </div>
        </template>
    </div>
    <div
        class="fui-editor flex-grow border-t border-secondary"
        v-if="platform || isScreenNotFound"
    >
        <div class="fui-editor__left -mb-8 border-r border-secondary">
            <slot name="left"></slot>
        </div>
        <div class="fui-editor__top pb-1">
            <slot name="title"></slot>
            <div class="flex flex-row text-sm mb-2 justify-center">
                <FuiSelectPlatform></FuiSelectPlatform>
                <FuiSelectDisplay></FuiSelectDisplay>
                <FuiSelectColors
                    v-if="platform !== U8g2Platform.id && platform !== FlipperPlatform.id"
                    :key="platform"
                ></FuiSelectColors>
            </div>
            <div
                class="font-sans flex flex-row gap-4 justify-between"
                v-if="isScreenLoaded && !isScreenNotFound"
            >
                <div class="w-1/6 text-center">
                    <Button
                        v-if="isFlipper && isSerialSupported"
                        @click="toggleFlipperPreview"
                        title="Preview your design in real-time on your Flipper via USB"
                    >
                        {{ flipperPreviewBtnText }}
                    </Button>
                </div>
                <div class="flex flex-1 items-center justify-center gap-4">
                    <FuiTools v-if="!readonly"></FuiTools>
                    <PaintColorModeToggle v-if="!readonly && showColorModeToggle" />
                    <PaintBrushColorInput v-if="!readonly && shouldShowBrushControls" />
                </div>
                <FuiSelectScale></FuiSelectScale>
            </div>
            <div
                v-if="!isScreenLoaded && !isScreenNotFound"
                class="mx-auto py-48 text-center"
            >
                <span class="loading loading-spinner text-primary loading-lg"></span>
            </div>
            <div
                v-if="isScreenNotFound"
                class="mx-auto py-48 text-center"
            >
                <span class="text-xl">404 Screen Not Found</span>
            </div>
        </div>
        <template v-if="isScreenLoaded && !isScreenNotFound">
            <div class="fui-editor__main">
                <div
                    class="fui-editor__canvas rounded-md"
                    @click.self="onMouseClick"
                >
                    <FuiCanvas :readonly="readonly" />
                </div>
            </div>
            <div class="fui-editor__main-right pl-2 border-l border-secondary">
                <Inspector
                    :readonly="readonly"
                    :project="project"
                    :screen="screen"
                />
            </div>
            <div class="fui-editor__bottom flex flex-row justify-center pt-2 border-t border-secondary">
                <div
                    class="flex-1 relative"
                    v-if="platform !== FreestylePlatform.id"
                >
                    <div class="absolute right-6 top-4 z-10 flex flex-row gap-2 content-center items-center">
                        <template v-if="!readonly">
                            <div
                                class="tooltip tooltip-bottom no-animation"
                                data-tip="Import code - Experimental: Works best with code generated in Lopaka"
                            >
                                <ImportFile
                                    type="code"
                                    title=""
                                    v-if="isPlatformWithParser"
                                >
                                    <div class="rounded-full bg-secondary w-8 h-8 flex items-center justify-center">
                                        <Icon
                                            type="download"
                                            pointer
                                        />
                                    </div>
                                </ImportFile>
                            </div>
                        </template>
                        <Button
                            success
                            filled
                            title="Copy source code"
                            @click="copyCode"
                        >
                            <Icon
                                type="clipboard"
                                pointer
                            />
                            Copy
                        </Button>
                    </div>
                    <FuiCode :readonly="readonly"></FuiCode>
                </div>
                <div class="fui-editor__bottom-right pl-4">
                    <FuiEditorSettings
                        :updates="immidiateUpdates"
                        v-if="platform !== Uint32RawPlatform.id && platform !== FreestylePlatform.id"
                    />
                </div>
            </div>
        </template>
    </div>
</template>
<style lang="css">
.fui-editor {
    display: grid;
    margin: 0 auto;
    grid-template-columns: 200px 1fr 220px;
    grid-template-rows: auto minmax(0, 1fr) auto;
    grid-column-gap: 8px;
    grid-row-gap: 8px;
    width: 100%;
    height: 100%;
    min-height: 0;
}

.fui-editor__left {
    grid-area: 1 / 1 / 4 / 2;
    max-height: 100%;
}

.fui-editor__top {
    grid-area: 1 / 2;
}

.fui-editor__main {
    /* width: 100%;
    grid-area: 2 / 2;
    min-height: 0;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: auto; */
}

.fui-editor__main-right {
    grid-area: 1 / 3 / 3 / 4;
}

.fui-editor__bottom {
    margin: 0 auto;
    grid-area: 3 / 2 / 3 / 4;
    width: 100%;
    min-height: 0;
}

.fui-editor__bottom-right {
    min-width: 230px;
    height: 0;
    min-height: 100%;
    overflow-y: auto;
}

.fui-editor__canvas {
    height: 100%;
    max-height: 100%;
    flex-shrink: 1;
    overflow: hidden;
    position: relative;
}
</style>
