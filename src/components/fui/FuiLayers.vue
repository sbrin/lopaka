<script lang="ts" setup>
import {computed, toRefs} from 'vue';
import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {useSession} from '../../core/session';
const session = useSession();
const {layers} = toRefs(session.state);
const activeLayer = computed(() => null);
function classNames(layer) {
    return {
        layer_selected: layer.isEditing(),
        layer_ignored: layer.isOverlay
    };
}

function setActive(layer: AbstractLayer) {
    layer.startEdit(EditMode.DRAWING);
    // activeLayer.value = layer;
}

function getLayerListItem(element: any) {
    // if (element.type === 'str') {
    //     return `${element.text || 'Empty str'}`;
    // }
    // if (element.type === 'icon') {
    //     return `${element.name}`;
    // }
    return `${element.name}`;
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
                <div class="layer__remove" @click="session.removeLayer(item as any)">×</div>
            </li>
        </ul>
    </div>
</template>
<style lang="css"></style>
