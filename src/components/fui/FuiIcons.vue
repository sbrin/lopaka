<script lang="ts" setup>
import {Point} from '../../core/point';
import {useSession} from '../../core/session';
import icons from '../../icons';
import {defineProps, toRefs} from 'vue';

const session = useSession();
const {activeLayer, activeTool} = toRefs(session.state);

const props = defineProps<{
    customImages: Array<any>;
    fuiImages: Object;
}>();
const emit = defineEmits(['cleanCustomIcons', 'prepareImages', 'iconClicked']);
let imagesSrc = [];

function cleanCustom() {
    emit('cleanCustomIcons');
}

function iconClick(e) {
    emit('iconClicked', e.target.dataset.name);
}

function iconDragStart(e) {
    e.dataTransfer.setData('name', e.srcElement.dataset.name);
    e.dataTransfer.setData('offset', `${e.offsetX}, ${e.offsetY}`);
}

function prepareCustomImages() {
    const customImages = {};
    props.customImages.forEach((icon) => {
        customImages[icon.name] = {
            element: icon.element,
            width: icon.width,
            height: icon.height,
            isCustom: icon.isCustom
        };
    });
    emit('prepareImages', {
        ...props.fuiImages,
        ...customImages
    });
}

function prepareImages() {
    const fuiImages = {};
    const imagesArr = [];
    Object.entries(icons).forEach((item) => {
        const [name, file] = item;
        const matchedSizeArr = name.match(/_([0-9]+)x([0-9]+)/i) ? name.match(/_([0-9]+)x([0-9]+)/i) : [0, 10, 10];
        const [, width, height] = matchedSizeArr.map((num) => parseInt(num, 10));
        const image = new Image(width, height);
        const src = file;
        image.src = src;
        image.crossOrigin = 'Anonymous';
        fuiImages[name] = {
            element: image,
            width: width,
            height: height,
            isCustom: false
        };
        imagesArr.push({
            src: src,
            name: name,
            element: image,
            width: width,
            height: height
        });
    });
    imagesArr.sort((a, b) => a.width * a.height - b.width * b.height);
    imagesSrc = imagesArr;
    emit('prepareImages', fuiImages);
}

prepareImages();
</script>
<template>
    <div class="fui-icons">
        <div v-if="customImages.length > 0" class="fui-icons__header">
            <div>Custom</div>
            <div class="fui-icons__remove-custom" @click="cleanCustom" title="Remove all custom icons">×</div>
        </div>
        <img
            v-for="(item, index) in customImages"
            @dragstart="iconDragStart"
            @click="iconClick"
            draggable="true"
            :key="index"
            :src="item.src"
            :data-name="item.name"
            :width="item.width * 2"
            :height="item.height * 2"
            :alt="item.name"
            :title="item.name"
        />
        <div v-if="customImages.length > 0" class="fui-icons__header">Default</div>
        <img
            v-for="(item, index) in imagesSrc"
            @dragstart="iconDragStart"
            @click="iconClick"
            draggable="true"
            :key="index"
            :src="item.src"
            :data-name="item.name"
            :width="item.width * 2"
            :height="item.height * 2"
            :alt="item.name"
            :title="item.name"
        />
    </div>
</template>
<style lang="css"></style>
