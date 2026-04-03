<script
    lang="ts"
    setup
>
import { ComputedRef, computed, UnwrapRef } from 'vue';
import { AbstractLayer } from '/src/core/layers/abstract.layer';
import { IconLayer } from '/src/core/layers/icon.layer';
import { TextLayer } from '/src/core/layers/text.layer';
import { TextAreaLayer } from '/src/core/layers/text-area.layer';
import { PaintLayer } from '/src/core/layers/paint.layer';
import Icon from '/src/components/layout/Icon.vue';
import { useSession } from '/src/core/session';

const props = defineProps<{
    item: AbstractLayer;
    readonly?: boolean;
    disabled?: boolean;
}>();

const emit = defineEmits([
    'selectLayer',
    'removeLayer',
    'lockLayer',
    'unlockLayer',
    'drag-start',
    'drag-end',
    'showLayer',
    'hideLayer',
]);

const session = useSession();

type LayerState = {
    selected: boolean;
    overlay: boolean;
    hidden: boolean;
    locked: boolean;
};

const layerState: ComputedRef<LayerState> = computed(() => {
    // rely on session counters so Vue tracks updates coming from raw layer instances
    session.state.selectionUpdates;
    session.state.immidiateUpdates;
    return {
        selected: props.item.selected,
        overlay: props.item.overlay,
        hidden: props.item.hidden,
        locked: props.item.locked,
    };
});

const classList = computed(() => ({
    'bg-base-300': layerState.value.selected,
    'text-gray-500': layerState.value.overlay,
}));

const displayName = computed(() => {
    session.state.immidiateUpdates;
    const layer = props.item as UnwrapRef<AbstractLayer>;
    if (layer.name) {
        return `${layer.name}`;
    }
    if (layer instanceof TextLayer || layer instanceof TextAreaLayer) {
        return `${layer.text || 'Empty text'}`;
    }
    if (layer instanceof IconLayer) {
        return `${layer.name}`;
    }
    return 'Unnamed layer';
});

function isVisible(layer: UnwrapRef<AbstractLayer>) {
    return layer.getType() !== 'paint' || (layer.getType() === 'paint' && (layer as PaintLayer).data);
}

function onDragstart(e: DragEvent) {
    e.stopPropagation();
    emit('drag-start', props.item, e);
    return true;
}

function onDragend() {
    emit('drag-end');
}
</script>
<template>
    <li
        class="layer pr-2"
        draggable="true"
        @dragstart="onDragstart"
        @dragend="onDragend"
        @click.stop="!disabled && emit('selectLayer', item)"
        v-show="isVisible(item)"
    >
        <a
            class="flex h-6 max-w-full pl-1 mb-[1px] rounded-none"
            :class="classList"
        >
            <Icon
                :type="item.getIcon()"
                sm
                class="text-gray-500 min-w-4"
            ></Icon>
            <div class="truncate grow">
                <span>{{ displayName }}</span>
            </div>
            <div
                class="flex w-5 gap-1 content-end mr-1"
                v-if="!readonly"
            >
                <div
                    class="w-[12px] layer-actions"
                    v-if="layerState.hidden"
                >
                    <Icon
                        @click.stop="!disabled && emit('showLayer', item)"
                        type="eye-slash"
                        xs
                    />
                </div>
                <div
                    class="w-[12px] layer-actions layer-actions-hidden"
                    v-if="!layerState.hidden"
                >
                    <Icon
                        @click.stop="!disabled && emit('hideLayer', item)"
                        type="eye"
                        xs
                    />
                </div>
                <div
                    class="w-[12px] layer-actions"
                    v-if="layerState.locked"
                >
                    <Icon
                        @click.stop="!disabled && emit('unlockLayer', item)"
                        type="lock-closed"
                        xs
                    />
                </div>
                <div
                    class="w-[12px] layer-actions layer-actions-hidden"
                    v-if="!layerState.locked"
                >
                    <Icon
                        @click.stop="!disabled && emit('lockLayer', item)"
                        type="lock-open"
                        xs
                    />
                </div>
            </div>
        </a>
    </li>
</template>
<style
    lang="css"
    scoped
>
.layer {
    .layer-actions-hidden {
        visibility: hidden;
    }

    &:hover {
        .layer-actions-hidden {
            visibility: visible;
        }
    }
}
</style>
