<script lang="ts" setup>
import {UnwrapRef, computed, toRefs} from 'vue';
import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {useSession} from '../../core/session';
import {TextLayer} from '../../core/layers/text.layer';
import {IconLayer} from '../../core/layers/icon.layer';
const session = useSession();
const {layers} = toRefs(session.state);
function classNames(layer) {
    return {
        layer_selected: layer.selected,
        layer_ignored: layer.isOverlay
    };
}

function setActive(layer: UnwrapRef<AbstractLayer>) {
    layers.value.forEach((l) => (l.selected = false));
    layer.selected = true;
}

function getLayerListItem(layer: UnwrapRef<AbstractLayer>) {
    if (layer instanceof TextLayer) {
        return `${layer.text || 'Empty text'}`;
    } else if (layer instanceof IconLayer) {
        return `${layer.name}`;
    }
    return `${layer.name}`;
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
                @click.self="setActive(item)"
            >
                <div class="layer__name" @click="setActive(item)">
                    {{ getLayerListItem(item) }}
                </div>
                <div class="layer__remove" @click="session.removeLayer(item as any)">×</div>
            </li>
        </ul>
    </div>
</template>
<style lang="css"></style>
