<script lang="ts" setup>
import {UnwrapRef, computed, ref, toRefs, watch} from 'vue';
import {AbstractLayer} from '../../core/layers/abstract.layer';
import {useSession} from '../../core/session';
import {TextLayer} from '../../core/layers/text.layer';
import {IconLayer} from '../../core/layers/icon.layer';
import VueDraggable from 'vuedraggable';
const session = useSession();
const drag = ref(false);

const layers = computed({
    get: () => session.state.updates && session.layersManager.sorted,
    set: (l) => {
        const len = l.length;
        l.forEach((layer, index) => {
            layer.index = len - index;
        });
        session.layersManager.requestUpdate();
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
    session.layersManager.clearSelection();
    session.layersManager.selectLayer(layer as AbstractLayer);
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
        <VueDraggable class="layers__list" v-model="layers" item-key="id" @start="drag = true" @end="drag = false">
            <template #item="{element}">
                <div class="layer" :class="classNames(element)" @click="setActive(element)">
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
                </div>
            </template>
        </VueDraggable>
    </div>
</template>
<style lang="css" scoped>
.layers__list {
    font-size: 24px;
    overflow: hidden;
    margin: 0 16px 16px 0;
    padding: 0 0 8px 0;
    overflow-y: auto;
}
</style>
