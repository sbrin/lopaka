<script lang="ts" setup>
import {UnwrapRef, computed, ref} from 'vue';
import {AbstractLayer} from '../../core/layers/abstract.layer';
import {useSession} from '../../core/session';
import {TextLayer} from '../../core/layers/text.layer';
import {IconLayer} from '../../core/layers/icon.layer';
import VueDraggable from 'vuedraggable';
const session = useSession();
const drag = ref(false);

const layers = computed({
    get: () => session.state.layers, //.sort((a, b) => b.index - a.index),
    set: (l) => {
        console.log(l.map((layer) => layer.index + ' ' + layer.getType()));
        l.forEach((layer, index) => {
            layer.index = index + 1;
        });
        session.virtualScreen.redraw();
    }
});

function classNames(layer) {
    return {
        layer_selected: layer.selected,
        layer_ignored: layer.isOverlay
    };
}

function setActive(layer: UnwrapRef<AbstractLayer>) {
    layers.value.forEach((l) => (l.selected = false));
    layer.selected = true;
    session.editor.selectionUpdate();
    session.virtualScreen.redraw();
}

function getLayerListItem(layer: UnwrapRef<AbstractLayer>) {
    if (layer instanceof TextLayer) {
        return `${layer.text || 'Empty text'}`;
    } else if (layer instanceof IconLayer) {
        return `${layer.name}`;
    }
    return `${layer.getType()}`;
}
</script>
<template>
    <div class="layers">
        <h2 class="title">
            Layers
            <slot></slot>
        </h2>
        <ul class="layers__list">
            <VueDraggable v-model="layers" item-key="id" @start="drag = true" @end="drag = false">
                <template #item="{element}">
                    <li class="layer" :class="classNames(element)" @click="setActive(element)">
                        <div class="layer__name">
                            {{ getLayerListItem(element) }}
                        </div>
                        <div
                            v-if="!session.state.isPublic"
                            class="layer__remove"
                            @click.stop="session.removeLayer(element as any)"
                        >
                            ×
                        </div>
                    </li>
                </template>
            </VueDraggable>
        </ul>
    </div>
</template>
<style lang="css"></style>
