<script lang="ts" setup>
import {ShallowRef, computed, onMounted, ref, toRefs, watch} from 'vue';
import {useSession} from '../core/session';
import {loadImageAsync, logEvent, postParentMessage, throttle} from '../utils';
import FuiButton from './fui/FuiButton.vue';
import FuiCanvas from './fui/FuiCanvas.vue';
import FuiCode from './fui/FuiCode.vue';
import FuiSelectDisplay from './fui/FuiSelectDisplay.vue';
import FuiSelectScale from './fui/FuiSelectScale.vue';
import FuiFile from './fui/FuiFile.vue';
import FuiIcons from './fui/FuiIcons.vue';
import FuiInspector from './fui/FuiInspector.vue';
import FuiLayers from './fui/FuiLayers.vue';
import FuiSelectPlatform from './fui/FuiSelectPlatform.vue';
import FuiTabs from './fui/FuiTabs.vue';
import FuiTools from './fui/FuiTools.vue';
import { FlipperRPC } from '../flipper-rpc';
import { Point } from "../core/point";
import { FlipperPlatform } from "../platforms/flipper";

let fuiImages = {},
    imageDataCache = {};

const fuiCanvas = ref(null),
    activeTab = ref('code'),
    codePreview = ref('');
const session = useSession();
const {display, platform, layers, activeLayer, activeTool, customImages} = toRefs(session.state);

// computed
const isEmpty = computed(() => layers.value.length === 0);
const isFlipper = computed(() => platform.value === FlipperPlatform.id);
const isSerialSupported = computed(() => window.navigator.serial !== undefined);
const flipperPreviewBtnText = computed(() => flipper.value ? "Disconnect" : "Live View");

const flipper: ShallowRef<FlipperRPC> = ref(null);

watch([activeLayer, layers],
    throttle(() => {
        console.log("postMessage");     
        postParentMessage("updateLayers", JSON.stringify(layers.value));
        postParentMessage("updateThumbnail", fuiCanvas.value?.screen?.toDataURL());
    }), {
    deep: true
});

// methods
function setactiveTab(tab) {
    activeTab.value = tab;
}

function prepareImages(e) {
    fuiImages = e;
}

function resetScreen() {
    layers.value = [];
    activeLayer.value = null;
    logEvent("button_reset");
}

function copyCode() {
    navigator.clipboard.writeText(codePreview.value);
    logEvent("button_copy");
}

function addImageToCanvas(data) {
    const newLayer = session.tools.icon.initLayer();
    newLayer.data.name = data.name;
    newLayer.data.icon = data.icon;
    newLayer.data.image = data.image;
    newLayer.size = new Point(data.width, data.height);
    
    session.tools.icon.startEdit(newLayer, new Point(0,0));
    session.tools.icon.stopEdit(newLayer);
    layers.value = [newLayer, ...layers.value];
    
    activeLayer.value = newLayer;
    activeLayer.value.index = layers.value.length;
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
        logEvent("button_flipper", "disconnect");
        flipperDisconnect()
    } else {
        logEvent("button_flipper", "connect");
        const flipperRPC = new FlipperRPC();
        const isConnected = await flipperRPC.connect();
        if (isConnected) {
            flipper.value = flipperRPC;
            sendFlipperImage();
        }
    }
}

function flipperDisconnect() {
    flipper.value.disconnect();
    flipper.value = null;
}

function sendFlipperImage() {
    flipper.value.sendImage(fuiCanvas.value.screen.getContext('2d').getImageData(0, 0, 128, 64));
}

onMounted(() => {
    postParentMessage('mounted', {});
});

window.addEventListener('message', async (event) => {
    if (event.data && event.data.target === 'lopaka_app') {
        console.log("CHILD", event.data)
        switch (event.data.type) {
            case 'loadProject':
                layers.value = event.data.payload.layers;
                session.setPlatform(event.data.payload.library);
                const displayArr = event.data.payload.display.split("×").map(n => parseInt(n));
                session.setDisplay(new Point(displayArr[0], displayArr[1]));
                loadCustomImages(event.data.payload.images);
                break;
        }
    }
});
navigator.serial?.addEventListener('disconnect', flipperDisconnect);
</script>
<template>
    <div class="fui-editor">
        <div class="fui-editor__left">
            <FuiLayers v-show="!!layers.length"></FuiLayers>
            <FuiButton @click="resetScreen" class="button_danger" v-show="!isEmpty">reset</FuiButton>
        </div>
        <div class="fui-editor__center">
            <div class="fui-editor-header">
                <FuiSelectPlatform></FuiSelectPlatform>
                <FuiSelectDisplay></FuiSelectDisplay>
                <FuiSelectScale></FuiSelectScale>
                <FuiButton 
                    v-if="isFlipper && isSerialSupported" 
                    @click="toggleFlipperPreview"
                    title="Connect your Flipper to USB port"
                >
                    {{ flipperPreviewBtnText }}
                </FuiButton>
            </div>
            <FuiTools></FuiTools>
            <FuiCanvas ref="fuiCanvas"/>
            <div class="fui-editor__tools">
                <div class="fui-editor-header">
                    <FuiTabs :active-tab="activeTab" @set-active-tab="setactiveTab"></FuiTabs>
                </div>
                <FuiIcons
                    v-show="activeTab === 'icons'"
                    :fui-images="fuiImages"
                    :custom-images="customImages"
                    @prepare-images="prepareImages"
                    @icon-clicked="addImageToCanvas"
                    @clean-custom-icons="cleanCustomIcons"
                    ref="fuiIconsList"
                ></FuiIcons>
                <FuiCode v-show="activeTab === 'code'" :content="codePreview"></FuiCode>
                <div class="buttons-bottom">
                    <FuiFile type="file" title="import image" @set-active-tab="setactiveTab"></FuiFile>
                    <FuiButton @click="copyCode" v-show="!!codePreview">copy code</FuiButton>
                </div>
            </div>
        </div>
        <div class="fui-editor__right">
            <FuiInspector />
        </div>
    </div>
</template>
<style lang="css">
body {
    visibility: visible !important;
}
</style>
