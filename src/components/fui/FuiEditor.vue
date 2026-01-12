<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, ShallowRef, toRefs, watch} from 'vue';
import {Project, ProjectScreen} from '/src/types';
import Button from '/src/components/layout/Button.vue';
import FuiCanvas from '/src/components/fui/FuiCanvas.vue';
import FuiCode from '/src/components/fui/FuiCode.vue';
import FuiEditorSettings from '/src/components/fui/FuiCodeSettings.vue';
import ImportFile from '/src/components/fui/ImportFile.vue';
import FuiIcons from '/src/components/fui/FuiIcons.vue';
import Inspector from '/src/components/fui/inspector/Inspector.vue';
import FuiSelectDisplay from '/src/components/fui/FuiSelectDisplay/FuiSelectDisplay.vue';
import FuiSelectPlatform from '/src/components/fui/FuiSelectPlatform.vue';
import FuiSelectScale from '/src/components/fui/FuiSelectScale.vue';
import FuiTabs from '/src/components/fui/FuiTabs.vue';
import FuiTools from '/src/components/fui/FuiTools.vue';
import Icon from '/src/components/layout/Icon.vue';
import {Point} from '/src/core/point';
import {saveLayers, useSession} from '/src/core/session';
import {FlipperRPC} from '/src/flipper-rpc';
import {FlipperPlatform} from '/src/platforms/flipper';
import {debounce, logEvent} from '/src/utils';
import {PaintLayer} from '/src/core/layers/paint.layer';
import {Uint32RawPlatform} from '/src/platforms/uint32-raw';
import ImportImageBtn from './importImage/ImportImageBtn.vue';
import FuiTimeline from '/src/components/fui/FuiTimeline.vue';

const props = defineProps<{
    project: Project | null;
    screen: ProjectScreen | null | undefined;
    readonly?: boolean;
    isScreenNotFound: boolean;
    isScreenLoaded: boolean;
    isSandbox?: boolean;
    auth?: boolean;
}>();

const emit = defineEmits(['showModalPricing', 'update', 'openPresenter', 'setInfoMessage', 'setErrorMessage']);

const fuiCanvas = ref(null),
    activeTab = ref('code'),
    session = useSession();
const {virtualScreen, state, platforms} = session;
const {platform, warnings} = toRefs(state);
const {updates} = toRefs(session.virtualScreen.state);
const flipper: ShallowRef<FlipperRPC> = ref(null);
const uploading = ref(false);

const isFlipper = computed(() => platform.value === FlipperPlatform.id);
const isSerialSupported = computed(() => window.navigator.serial !== undefined);
const flipperPreviewBtnText = computed(() => (flipper.value ? 'Disconnect' : 'Live View'));
const isPlatformWithParser = computed(() => platforms[platform.value].hasParser());

watch(
    updates,
    debounce((newValue, oldValue) => {
        if (oldValue <= 1) return; // Ignore initial value
        if (flipper.value) {
            sendFlipperImage();
        }
        saveLayers(props.screen.id);
        updateScreenPreview(props.screen.id);
    }, 1000)
);

watch(warnings, () => {
    setWarnings(session.state.warnings);
});

onMounted(async () => {
    navigator.serial?.addEventListener('disconnect', flipperDisconnect);
});

onBeforeUnmount(() => {
    navigator.serial?.removeEventListener('disconnect', flipperDisconnect);
});

function setActiveTab(tab) {
    activeTab.value = tab;
}

function addImageToCanvas(data) {
    session.state.layers.forEach((layer) => (layer.selected = false));
    const newLayer = new PaintLayer(session.getPlatformFeatures());
    newLayer.name = data.name;
    newLayer.selected = true;
    newLayer.modifiers.icon.setValue(data.icon);
    newLayer.size = new Point(data.width, data.height);
    newLayer.updateBounds();
    newLayer.stopEdit();
    session.addLayer(newLayer);
    virtualScreen.redraw();
    session.editor.setTool(null);
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
            if (updates.value) {
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

function updateScreenPreview(screen_id) {
    if (!props.project.screens) return;
    props.project.screens = props.project.screens.map((item) => {
        if (item && item?.id === screen_id) {
            item.img_preview = session.virtualScreen.canvas.toDataURL();
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

function toggleUploadProgress(value) {
    uploading.value = value;
}

function setWarnings(warnings) {
    warnings.forEach((warning, idx) => {
        console.log(warning);

        setTimeout(() => warnings.shift(), 3000 * (1 + idx));
    });
}
</script>

<template>
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
        class="fui-editor flex-grow"
        v-if="platform || isScreenNotFound"
    >
        <div class="fui-editor__left">
            <slot name="left"></slot>
        </div>
        <div>
            <slot name="title"></slot>
            <div
                class="flex flex-row text-sm mb-2 justify-center"
                v-if="!auth && !readonly"
            >
                <FuiSelectPlatform></FuiSelectPlatform>
                <FuiSelectDisplay></FuiSelectDisplay>
            </div>
            <div
                class="font-sans flex flex-row gap-4 justify-between"
                v-if="isScreenLoaded && !isScreenNotFound"
            >
                <div class="w-1/5">
                    <Button
                        v-if="isFlipper && isSerialSupported"
                        @click="toggleFlipperPreview"
                        title="Preview your design in real-time on your Flipper via USB"
                    >
                        {{ flipperPreviewBtnText }}
                    </Button>
                </div>
                <FuiTools v-if="!readonly"></FuiTools>
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
                <div class="fui-editor__canvas">
                    <FuiCanvas
                        ref="fuiCanvas"
                        :readonly="readonly"
                    />
                </div>
                <FuiTimeline :readonly="readonly" />
            </div>

            <div class="fui-editor__main-right">
                <Inspector
                    :readonly="readonly"
                    :project="project"
                    :screen="screen"
                />
            </div>
            <div class="fui-editor__bottom">
                <div class="flex flex-col justify-between overflow-hidden">
                    <div class="flex flex-row justify-between">
                        <div class="flex flex-row items-end">
                            <FuiTabs
                                v-if="!readonly"
                                :active-tab="activeTab"
                                @set-active-tab="setActiveTab"
                            ></FuiTabs>
                        </div>
                        <div class="flex justify-end gap-2 pb-2">
                            <template v-if="!readonly">
                                <div class="">
                                    <div
                                        class="tooltip tooltip-bottom no-animation"
                                        data-tip="Experimental: Works best with code generated in Lopaka"
                                    >
                                        <ImportFile
                                            type="code"
                                            title="import code"
                                            @set-active-tab="setActiveTab"
                                            v-if="isPlatformWithParser"
                                        ></ImportFile>
                                    </div>
                                </div>
                                <div class="">
                                    <ImportImageBtn
                                        @set-active-tab="setActiveTab"
                                        @uploading="toggleUploadProgress"
                                        :isSandbox="isSandbox"
                                    />
                                </div>
                            </template>
                            <Button
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
                    </div>
                    <FuiIcons
                        v-show="activeTab === 'images'"
                        @icon-clicked="addImageToCanvas"
                        :isSandbox="isSandbox"
                    ></FuiIcons>
                    <FuiCode
                        v-show="activeTab === 'code'"
                        :readonly="readonly"
                    ></FuiCode>
                </div>
            </div>
            <div class="fui-editor__bottom-right">
                <FuiEditorSettings
                    :updates="updates"
                    v-if="platform !== Uint32RawPlatform.id"
                />
            </div>
        </template>
    </div>
</template>
<style lang="css">
.fui-editor {
    display: grid;
    margin: 0 auto;
    grid-template-columns: 160px auto 210px;
    /* grid-template-rows: auto auto auto; */
    grid-column-gap: 8px;
    grid-row-gap: 8px;
    width: 100%;
}

.fui-editor__left {
    grid-area: 1 / 1 / 4 / 2;
}

.fui-editor__top {
    grid-area: 1 / 2 / 4;
}

.fui-editor__main {
    min-width: var(--main-width);
    grid-area: 2 / 2 / 3 / 3;
    min-height: 340px;
    padding-right: 8px;
}

.fui-editor__main-right {
    grid-area: 1 / 3 / 3 / 4;
}

.fui-editor__bottom {
    margin: 0 auto;
    grid-area: 3 / 2 / 4 / 3;
    max-width: var(--main-width);
    width: 100%;
}

.fui-editor__bottom-right {
    grid-area: 3 / 3 / 4 / 4;
}

.fui-editor__canvas {
    max-height: 75vh;
    flex-shrink: 0;
    overflow: auto;
    display: flex;
    padding: 10px 20px 20px 20px;
    margin: 0 auto;
}
</style>
