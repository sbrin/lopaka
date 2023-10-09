<script lang="ts" setup>
import {computed, onMounted, ref, toRefs} from 'vue';
import {useSession} from '../core/session';
import {toCppVariableName} from '../utils';
import FuiButton from './fui/FuiButton.vue';
import FuiCanvas from './fui/FuiCanvas.vue';
import FuiCode from './fui/FuiCode.vue';
import FuiDisplays from './fui/FuiDisplays.vue';
import FuiFile from './fui/FuiFile.vue';
import FuiIcons from './fui/FuiIcons.vue';
import FuiInspector from './fui/FuiInspector.vue';
import FuiLayers from './fui/FuiLayers.vue';
import FuiLibrary from './fui/FuiLibrary.vue';
import FuiTabs from './fui/FuiTabs.vue';
import FuiTools from './fui/FuiTools.vue';

let fuiImages = {},
    imageDataCache = {};

const fuiCanvas = ref(null),
    activeTab = ref('code'),
    codePreview = ref(''),
    customImages = ref([]);
const session = useSession();
const {display, platform, layers, activeLayer, activeTool} = toRefs(session.state);

// computed
const isEmpty = computed(() => layers.value.length === 0);
const isFlipper = computed(() => platform.value === 'Flipper Zero');
// methods
function setactiveTab(tab) {
    activeTab.value = tab;
}
function prepareImages(e) {
    fuiImages = e;
}
function updateFuiImages(layer) {
    const {name, element, width, height} = layer;
    const nameFormatted = toCppVariableName(name);
    if (!fuiImages[name]) {
        fuiImages[name] = {
            width: width,
            height: height,
            element: element,
            isCustom: true
        };
        customImages.value = [
            ...customImages.value,
            {
                name: nameFormatted,
                width: width,
                height: height,
                element: element,
                src: element.src,
                isCustom: true
            }
        ];
    }
    setactiveTab('icons');
}

function resetScreen() {
    layers.value = [];
}
function copyCode() {
    navigator.clipboard.writeText(codePreview.value);
}
function addImageToCanvas(name) {
    // TODO
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

function postMessage(type, data) {
    if (window.top !== window.self) {
        window.top.postMessage({target: 'lopaka_app', type: type, payload: data}, '*');
    }
}

onMounted(() => {
    if (isFlipper) {
        // activeTool.value = getToolByLayerType('frame');
    }
    postMessage('mounted', {});
});
</script>
<template>
    <div class="fui-editor">
        <div class="fui-editor__left">
            <FuiLayers v-show="!!layers.length"></FuiLayers>
            <FuiButton @click="resetScreen" title="reset" class="button_danger" v-show="!isEmpty"></FuiButton>
        </div>
        <div class="fui-editor__center">
            <div class="fui-editor-header">
                <FuiLibrary></FuiLibrary>
                <FuiDisplays></FuiDisplays>
            </div>
            <FuiCanvas ref="fuiCanvas" :fui-images="fuiImages" :imageDataCache="imageDataCache" />
            <div class="fui-editor__tools">
                <FuiTools></FuiTools>
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
                    <FuiFile type="file" title="import image" @update-fui-images="updateFuiImages"></FuiFile>
                    <FuiButton @click="copyCode" title="copy code" v-show="!!codePreview"></FuiButton>
                </div>
            </div>
        </div>
        <div class="fui-editor__right">
            <FuiInspector />
            <!-- <fui-settings :isInverted="isInverted" @redraw-canvas="redrawCanvas" @toggle-invert="toggleInvert"/> -->
        </div>
    </div>
</template>
<style lang="css"></style>
