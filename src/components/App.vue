<script lang="ts" setup>
import {computed, onMounted, ref, toRefs} from 'vue';
import {useSession} from '../core/session';
import {toCppVariableName} from '../utils';
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
import { Layer } from "../core/layer";
import { Point } from "../core/point";

let fuiImages = {},
    imageDataCache = {};

const fuiCanvas = ref(null),
    activeTab = ref('code'),
    codePreview = ref('');
const session = useSession();
const {display, platform, layers, activeLayer, activeTool, customImages} = toRefs(session.state);

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

function resetScreen() {
    layers.value = [];
    activeLayer.value = null;
}

function copyCode() {
    navigator.clipboard.writeText(codePreview.value);
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

function postMessage(type, data) {
    if (window.top !== window.self) {
        window.top.postMessage({target: 'lopaka_app', type: type, payload: data}, '*');
    }
}

onMounted(() => {
    postMessage('mounted', {});
});
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
<style lang="css"></style>
