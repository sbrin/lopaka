<script lang="ts" setup>
import {useSession} from '../../core/session';
import {computed, ref, toRefs} from 'vue';
import {iconsList} from '../../icons/icons';

const session = useSession();
const {customImages} = toRefs(session.state);
const emit = defineEmits(['cleanCustomIcons', 'prepareImages', 'iconClicked']);
const iconsActive = ref('gaai');

const icons = computed(() => {
    return iconsList[iconsActive.value].icons.sort((a, b) => a.width * a.height - b.width * b.height);
});

function toggleIcons(val) {
    if (iconsActive.value === val) {
        iconsActive.value = val = 'none';
    } else {
        iconsActive.value = val;
    }
}

function cleanCustom() {
    customImages.value = [];
}

function iconClick(e) {
    const image =
        icons.value.find((item) => item.name === e.target.dataset.name) ??
        customImages.value.find((item) => item.name === e.target.dataset.name);
    const data = {
        name: e.target.dataset.name,
        width: image.width,
        height: image.height,
        icon: e.target //image.image
    };
    emit('iconClicked', data);
}

function iconDragStart(e: DragEvent) {
    const target = e.target as HTMLImageElement;
    e.dataTransfer.dropEffect = 'move';
    e.dataTransfer.setData('text/plain', target.dataset.name);
    e.dataTransfer.setData('text/uri', target.src);
}
</script>
<template>
    <div class="fui-icons">
        <div v-if="customImages.length > 0" class="fui-iconset">
            <div class="fui-icons__header">
                <div>Custom</div>
                <div
                    class="fui-icons__button fui-icons__remove-custom"
                    @click="cleanCustom"
                    title="Remove all custom icons"
                >
                    ×
                </div>
            </div>
            <img
                v-for="(item, index) in customImages"
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
        <div v-for="(value, key) in iconsList" class="fui-iconset">
            <div class="fui-icons__header" @click="toggleIcons(key)">
                <div class="fui-icons__button fui-icons__toggle" title="Toggle">
                    {{ key === iconsActive ? `-` : `+` }}
                </div>
                <div>{{ value.title }}</div>
            </div>
            <template v-if="key === iconsActive">
                <img
                    v-for="(item, index) in icons"
                    @dragstart="iconDragStart"
                    @click="iconClick"
                    draggable="true"
                    :key="index"
                    :src="item.image"
                    :data-name="item.name"
                    :width="item.width * 2"
                    :height="item.height * 2"
                    :alt="item.name"
                    :title="item.name"
                />
            </template>
        </div>
    </div>
</template>
<style lang="css">
.fui-icons {
    overflow-y: auto;
    background: var(--primary-color);
    border: 2px solid var(--border-dark-color);
    border-radius: 0 10px 10px 10px;
    border-top: 0;
    margin: 0 0 8px 0;
    padding: 16px;
    height: 256px;
    color: var(--secondary-color);
}

.fui-iconset {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
}

.fui-icons img {
    cursor: pointer;
    image-rendering: pixelated;
    display: block;
    margin: 8px;
    border: 1px solid var(--border-color);
    max-width: 128px;
    height: auto;
}

.fui-icons__header {
    cursor: pointer;
    font-size: 24px;
    display: flex;
    align-items: center;
    height: 24px;
    width: 100%;
}

.fui-icons__header:hover .fui-icons__button {
    display: block;
}

.fui-icons__remove-custom {
    display: none;
    cursor: pointer;
    color: var(--danger-color);
    margin: 0 8px;
}

.fui-icons__toggle {
    margin: 0 8px 0 0;
    padding: 0 3px 0 4px;
    border: 1px solid var(--border-dark-color);
    border-radius: 4px;
    text-align: center;
}
</style>
