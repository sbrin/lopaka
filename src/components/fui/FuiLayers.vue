<script lang="ts" setup>
import {defineEmits, defineProps} from 'vue';

const props = defineProps<{
    screenElements: any[];
    currentLayer: any;
}>();

const emit = defineEmits(['updateCurrentLayer', 'removeLayer']);

function classNames(item) {
    return {
        layer_selected: props.currentLayer && props.currentLayer.index === item.index,
        layer_ignored: item.isOverlay
    };
}

function updateCurrentLayer(item: any) {
    emit('updateCurrentLayer', item);
}

function removeLayer(index: number) {
    emit('removeLayer', index);
}

function getLayerListItem(element: any) {
    if (element.type === 'str') {
        return `${element.text || 'Empty str'}`;
    }
    if (element.type === 'icon') {
        return `${element.name}`;
    }
    return `${element.type}`;
}
</script>
<template>
    <div class="layers">
        <h2 class="title">Layers</h2>
        <ul class="layers__list">
            <li
                v-for="(item, idx) in screenElements"
                :key="idx"
                class="layer"
                :class="classNames(item)"
                @click.self="updateCurrentLayer(item)"
            >
                <div class="layer__name" @click="updateCurrentLayer(item)">
                    {{ getLayerListItem(item) }}
                </div>
                <div class="layer__remove" @click="removeLayer(item.index)">×</div>
            </li>
        </ul>
    </div>
</template>
<style lang="css"></style>
