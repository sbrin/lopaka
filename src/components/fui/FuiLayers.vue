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
    get: () => session.state.layers.slice().sort((a, b) => b.index - a.index),
    set: (l) => {
        const len = l.length;
        l.forEach((layer, index) => {
            layer.index = len - index;
        });
        session.state.layers = l.slice().sort((a, b) => a.index - b.index);
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


.layer {
    display: flex;
    align-items: center;
    cursor: pointer;
    height: 20px;
    padding: 2px 0 2px 8px;
    margin-bottom: 1px;
    border-radius: 4px;
    justify-content: space-between;
}

.layer:hover {
    background-color: var(--secondary-color);
}

.layer:hover .layer__remove {
    display: block;
}

.layer__name {
    max-width: 132px;
    overflow: hidden;
    white-space: nowrap;
}

.layer_ignored {
    color: #999;
}

.layer_selected .layer__name:before {
    display: inline-block;
    content: '';
    background: var(--success-color);
    transform: translateY(-4px);
    width: 4px;
    height: 4px;
    margin-right: 4px;
}

.layer__remove {
    display: none;
    color: var(--danger-color);
    margin: 0 8px;
    padding-bottom: 4px;
}
</style>
