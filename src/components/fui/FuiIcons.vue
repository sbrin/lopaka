<script lang="ts" setup>
import {useSession} from '../../core/session';
import iconsUrls from '../../icons';
import {computed, toRefs} from 'vue';
import FuiImageDataPreview from './FuiImageDataPreview.vue';
import {TImage, updateImageLibrary} from '../../core/image-library';
import {PaintLayer} from '../../core/layers/paint.layer';
import {Point} from '../../core/point';

const session = useSession();
const {customImages, scale, images} = toRefs(session.state);
const emit = defineEmits(['cleanCustomIcons', 'prepareImages', 'iconClicked']);

const icons = computed((): TLayerImageData[] => {
    return Object.entries(iconsUrls)
        .map((item) => {
            const [name, file] = item;
            const matchedSizeArr = name.match(/_([0-9]+)x([0-9]+)/i) ? name.match(/_([0-9]+)x([0-9]+)/i) : [0, 10, 10];
            const [, width, height] = matchedSizeArr.map((num) => parseInt(num, 10));
            const image = new Image(width, height);
            image.crossOrigin = 'Anonymous';
            image.dataset.name = name;
            image.src = file;
            return {
                name,
                width,
                height,
                image
            };
        })
        .sort((a, b) => a.width * a.height - b.width * b.height);
});

function cleanCustom() {
    customImages.value = [];
}

function iconClick(e: MouseEvent) {
    const target = e.target as HTMLImageElement;
    const image =
        icons.value.find((item) => item.name === target.dataset.name) ??
        customImages.value.find((item) => item.name === target.dataset.name);
    const data = {
        name: target.dataset.name,
        width: image.width,
        height: image.height,
        icon: image.image
    };
    emit('iconClicked', data);
}

function iconDragStart(e: DragEvent) {
    const target = e.target as HTMLImageElement;
    e.dataTransfer.dropEffect = 'move';
    e.dataTransfer.setData('text/plain', target.dataset.name);
    e.dataTransfer.setData('text/uri', target.src);
}

function canvasClick(image: TImage) {
    session.state.layers.forEach((layer) => (layer.selected = false));
    const newLayer = new PaintLayer(session.getPlatformFeatures());
    newLayer.size = new Point(image.width, image.height);
    newLayer.selected = true;
    newLayer.modifiers.image.setValue(image);
    newLayer.stopEdit();
    session.addLayer(newLayer);
    session.virtualScreen.redraw();
    updateImageLibrary();
}

function canvasDragStart(e: DragEvent, image: TImage) {
    e.dataTransfer.dropEffect = 'move';
    e.dataTransfer.setData('text/plain', 'ID');
    e.dataTransfer.setData('text/uri', image.id);
}
</script>
<template>
    <div class="fui-icons">
        <div class="fui-icons__header" v-if="images.size">
            <div>In use</div>
        </div>
        <FuiImageDataPreview
            v-for="image in images.values()"
            :image="image"
            @click="canvasClick(image)"
            @dragstart="canvasDragStart($event, image)"
        />

        <div v-if="customImages.length > 0" class="fui-icons__header">
            <div>Custom</div>
            <div class="fui-icons__remove-custom" @click="cleanCustom" title="Remove all custom icons">×</div>
        </div>
        <img
            v-for="(item, index) in customImages"
            @dragstart="iconDragStart"
            @click="iconClick"
            :key="index"
            :src="item.image.src"
            :data-name="item.name"
            :width="item.width * 2"
            :height="item.height * 2"
            :alt="item.name"
            :title="item.name"
        />
        <div class="fui-icons__header" v-if="images.size || customImages.length">Default</div>
        <img
            v-for="(item, index) in icons"
            @dragstart="iconDragStart"
            @click="iconClick"
            draggable="true"
            :key="index"
            :src="item.image.src"
            :data-name="item.name"
            :width="item.width * 2"
            :height="item.height * 2"
            :alt="item.name"
            :title="item.name"
        />
    </div>
</template>
<style lang="css"></style>
