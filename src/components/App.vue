<script lang="ts" setup>
import {ShallowRef, computed, onBeforeUnmount, onMounted, ref, toRefs, watch} from 'vue';
import {IconLayer} from '../core/layers/icon.layer';
import {Point} from '../core/point';
import {loadLayers, saveLayers, useSession} from '../core/session';
import {FlipperRPC} from '../flipper-rpc';
import {FlipperPlatform} from '../platforms/flipper';
import {debounce, loadImageAsync, logEvent, postParentMessage, throttle} from '../utils';
import FuiButton from './fui/FuiButton.vue';
import FuiCanvas from './fui/FuiCanvas.vue';
import FuiCode from './fui/FuiCode.vue';
import FuiFile from './fui/FuiFile.vue';
import FuiIcons from './fui/FuiIcons.vue';
import FuiInspector from './fui/FuiInspector.vue';
import FuiLayers from './fui/FuiLayers.vue';
import FuiSelectDisplay from './fui/FuiSelectDisplay/FuiSelectDisplay.vue';
import FuiSelectPlatform from './fui/FuiSelectPlatform.vue';
import FuiSelectScale from './fui/FuiSelectScale.vue';
import FuiTabs from './fui/FuiTabs.vue';
import FuiTools from './fui/FuiTools.vue';
import FuiEditorSettings from './fui/FuiCodeSettings.vue';

let fuiImages = {},
    imageDataCache = {};

const fuiCanvas = ref(null),
    activeTab = ref('code'),
    currentHash = ref(window.location.hash);
const session = useSession();
const {editor, virtualScreen, state} = session;
const {platform, customImages} = toRefs(state);
const {updates} = toRefs(virtualScreen.state);

// computed
const isEmpty = computed(() => updates.value && session.state.layers.length === 0);
const isFlipper = computed(() => platform.value === FlipperPlatform.id);
const isSerialSupported = computed(() => window.navigator.serial !== undefined);
const flipperPreviewBtnText = computed(() => (flipper.value ? 'Disconnect' : 'Live View'));
const showCopyCode = computed(() => updates.value && session.state.layers.length > 0);

const isNotIframe = window.top === window.self;

const flipper: ShallowRef<FlipperRPC> = ref(null);

watch(
    updates,
    debounce(() => {
        if (flipper.value) {
            sendFlipperImage();
        }
        saveLayers();
    }, 1000)
);

// methods

function setactiveTab(tab) {
    activeTab.value = tab;
}

function prepareImages(e) {
    fuiImages = e;
}

function resetScreen() {
    session.clearLayers();
    editor.setTool(null);
    logEvent('button_reset');
}

function copyCode() {
    navigator.clipboard.writeText(session.generateCode().code);
    logEvent('button_copy');
}

function addImageToCanvas(data) {
    session.state.layers.forEach((layer) => (layer.selected = false));
    const newLayer = new IconLayer(session.getPlatformFeatures());
    newLayer.name = data.name;
    newLayer.selected = true;
    newLayer.modifiers.icon.setValue(data.icon);
    newLayer.size = new Point(data.width, data.height);
    newLayer.updateBounds();
    newLayer.stopEdit();
    session.addLayer(newLayer);
    virtualScreen.redraw();
}

function cleanCustomIcons() {
    for (let key in fuiImages) {
        if (fuiImages[key].isCustom) {
            delete fuiImages[key];
            delete imageDataCache[key];
        }
    }
    customImages.value = [];
}

async function loadCustomImages(images: any[]) {
    for (let item of images) {
        const image = await loadImageAsync(item.url);
        customImages.value.push({
            name: item.name,
            width: image.width,
            height: image.height,
            image: image,
            isCustom: true
        });
    }
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

onMounted(() => {
    postParentMessage('mounted', {});
});

window.addEventListener('message', async (event) => {
    if (event.data?.target === 'lopaka_app') {
        console.log('CHILD', event.data);
        switch (event.data.type) {
            case 'loadProject':
                // TODO loading project
                // move to session and provider
                session.unlock();
                session.setIsPublic(!!event.data.payload.isPublic);
                await session.setPlatform(event.data.payload.library, false, event.data.payload.layers);
                const displayArr = event.data.payload.display.split('×').map((n) => parseInt(n));
                session.setDisplay(new Point(displayArr[0], displayArr[1]));
                loadCustomImages(event.data.payload.images);
                break;
            case 'keydownParent':
                const parentKeyEvent = new KeyboardEvent('keydown', {code: event.data.payload});
                editor.handleEvent(parentKeyEvent);
                break;
        }
    }
});
navigator.serial?.addEventListener('disconnect', flipperDisconnect);
</script>
<template>
    <div class="grid grid-flow-col justify-start">
        <Sections />
        <div class="fui-editor" v-if="platform">
            <div class="fui-editor__left">
                <FuiLayers v-show="!isEmpty"></FuiLayers>
            </div>
            <div class="font-sans">
                <div class="flex flex-row text-sm justify-center">
                    <template v-if="isNotIframe">
                        <FuiSelectPlatform></FuiSelectPlatform>
                        <FuiSelectDisplay></FuiSelectDisplay>
                    </template>
                    <FuiSelectScale></FuiSelectScale>
                    <FuiButton
                        v-if="isFlipper && isSerialSupported"
                        @click="toggleFlipperPreview"
                        title="Connect your Flipper to USB port"
                    >
                        {{ flipperPreviewBtnText }}
                    </FuiButton>
                </div>
                <FuiTools v-if="!session.state.isPublic"></FuiTools>
            </div>
            <div></div>
            <div class="fui-editor__main" v-if="platform">
                <div class="fui-editor__canvas">
                    <FuiCanvas ref="fuiCanvas" />
                </div>
            </div>
            <div class="fui-editor__main-right">
                <FuiInspector />
            </div>
            <div class="fui-editor__bottom">
                <div class="fui-editor__tabs">
                    <div v-if="!session.state.isPublic">
                        <FuiTabs :active-tab="activeTab" @set-active-tab="setactiveTab"></FuiTabs>
                    </div>
                    <FuiIcons
                        v-show="activeTab === 'images'"
                        :fui-images="fuiImages"
                        :custom-images="customImages"
                        @prepare-images="prepareImages"
                        @icon-clicked="addImageToCanvas"
                        @clean-custom-icons="cleanCustomIcons"
                        ref="fuiIconsList"
                    ></FuiIcons>
                    <FuiCode v-show="activeTab === 'code'"></FuiCode>
                    <div class="buttons-bottom">
                        <div>
                            <FuiFile
                                style="margin-right: 8px"
                                v-if="!session.state.isPublic"
                                type="code"
                                title="import code"
                                @set-active-tab="setactiveTab"
                            ></FuiFile>
                            <FuiFile
                                v-if="!session.state.isPublic"
                                type="image"
                                title="import image"
                                @set-active-tab="setactiveTab"
                            ></FuiFile>
                        </div>
                        <FuiButton @click="copyCode" v-show="showCopyCode">copy code</FuiButton>
                    </div>
                </div>
            </div>
            <div class="fui-editor__bottom-right">
                <FuiEditorSettings />
            </div>
        </div>
    </div>
</template>
<style lang="css">
.fui-editor {
    margin: 0 auto;
    font-family: 'haxrcorp4089_tr';
    grid-template-columns: 150px auto 240px;
    width: -moz-fit-content;
    width: fit-content;

    position: relative;
    box-sizing: border-box;

    display: grid;
    grid-template-columns: 180px 4fr 240px;
    grid-template-rows: 80px auto 450px;
    grid-column-gap: 16px;
    grid-row-gap: 8px;
}

.fui-editor__left {
    grid-area: 1 / 1 / 5 / 2;
}
.fui-editor__top {
    grid-area: 1 / 2 / 4;
}
.fui-editor__main {
    min-width: var(--main-width);
    grid-area: 2 / 2 / 3 / 3;
    min-height: 300px;
}
.fui-editor__main-right {
    grid-area: 2 / 3 / 3 / 4;
}
.fui-editor__bottom {
    grid-area: 3 / 2 / 4 / 3;
    max-width: var(--main-width);
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

.fui-editor__tabs {
}

.fui-editor__main {
}

body {
    visibility: visible !important;
}
</style>
