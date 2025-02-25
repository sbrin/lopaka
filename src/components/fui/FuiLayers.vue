<script lang="ts" setup>
import {UnwrapRef, computed, ref} from 'vue';
import {AbstractLayer} from '../../core/layers/abstract.layer';
import {useSession} from '../../core/session';
import {TextLayer} from '../../core/layers/text.layer';
import {IconLayer} from '../../core/layers/icon.layer';
import VueDraggable from 'vuedraggable';
import Icon from '/src/components/layout/Icon.vue';
import {PaintLayer} from '/src/core/layers/paint.layer';

const props = defineProps<{
    readonly?: boolean;
}>();

const session = useSession();
const drag = ref(false);

const disabled = computed(
    () =>
        session.editor.state.activeLayer?.getType() === 'paint' &&
        !(session.editor.state.activeLayer as PaintLayer).data
);

const layers = computed({
    get: () => session.state.layers.slice().sort((a, b) => b.index - a.index),
    set: (l) => {
        const len = l.length;
        l.forEach((layer, index) => {
            layer.index = len - index;
        });
        session.state.layers = l.slice().sort((a, b) => a.index - b.index);
        session.virtualScreen.redraw();
    },
});

function classNames(layer) {
    return {
        'bg-base-300': layer.selected,
        'text-gray-500': layer.overlay,
    };
}

function setActive(layer: UnwrapRef<AbstractLayer>) {
    session.state.layers.forEach((l) => (l.selected = false));
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
    return `${layer.name}`;
}
</script>
<template>
    <ul class="menu menu-xs w-[150px] p-0">
        <VueDraggable
            class="layers-list max-w-full"
            v-model="layers"
            item-key="id"
            @start="drag = true"
            @end="drag = false"
            :disabled="readonly || disabled"
        >
            <template #item="{element}">
                <li
                    class="layer"
                    @click="!disabled && setActive(element)"
                    v-show="element.type !== 'paint' || (element.type === 'paint' && (element as PaintLayer).data)"
                >
                    <a
                        class="flex h-6 max-w-full pl-1 mb-[1px] rounded-none"
                        :class="classNames(element)"
                    >
                        <Icon
                            :type="element.type"
                            sm
                            class="text-gray-500 min-w-4"
                        ></Icon>
                        <div class="truncate grow">
                            <span>{{ getLayerListItem(element) }}</span>
                        </div>
                        <div
                            v-if="!readonly && element.locked"
                            class="btn btn-xs btn-square btn-ghost layer-actions -mr-2"
                            @click.stop="!disabled && session.unlockLayer(element as any)"
                        >
                            <Icon
                                type="lock-closed"
                                xs
                            />
                        </div>
                        <div
                            v-if="!readonly && !element.locked"
                            class="btn btn-xs btn-square btn-ghost hidden layer-actions -mr-2"
                            @click.stop="!disabled && session.lockLayer(element as any)"
                        >
                            <Icon
                                type="lock-open"
                                xs
                            />
                        </div>
                    </a>
                </li>
            </template>
        </VueDraggable>
    </ul>
</template>
<style lang="css" scoped>
.sortable-chosen {
    opacity: 0.5;
}

.sortable-ghost {
    opacity: 1;
    border: 1px dashed white;
}

.layer:hover .layer-actions {
    display: flex;
}

.layer_ignored {
    color: #999;
}

.layers-list {
    height: calc(100vh - 135px);
    overflow-y: auto;
}
</style>
