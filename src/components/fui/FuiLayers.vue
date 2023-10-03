<script lang="ts" setup>
import {toRefs} from 'vue';
import {useSession} from '../../core/session';
import {Layer} from '../../core/layer';

const {layers, activeLayer, removeLayer} = toRefs(useSession());

function classNames(layer) {
    return {
        layer_selected: activeLayer.value && activeLayer.value.index === layer.index,
        layer_ignored: layer.isOverlay
    };
}

function setActive(layer: Layer) {
    activeLayer.value = layer;
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
                v-for="(item, idx) in layers"
                :key="idx"
                class="layer"
                :class="classNames(item)"
                @click.self="setActive(item as any)"
            >
                <div class="layer__name" @click="setActive(item as any)">
                    {{ getLayerListItem(item) }}
                </div>
                <div class="layer__remove" @click="removeLayer(item as any)">×</div>
            </li>
        </ul>
    </div>
</template>
<style lang="css"></style>
