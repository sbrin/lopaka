<script setup lang="ts">
import {UnwrapRef} from 'vue';
import {AbstractLayer, TLayerAction} from '/src/core/layers/abstract.layer';
import {addCustomImage, useSession} from '/src/core/session';
import {imageDataToImage, logEvent} from '/src/utils';
import {AbstractImageLayer} from '/src/core/layers/abstract-image.layer';
import Button from '/src/components/layout/Button.vue';
import Icon from '/src/components/layout/Icon.vue';

const session = useSession();

const props = defineProps<{
    actions: TLayerAction[];
    activeLayer: UnwrapRef<AbstractLayer>;
}>();

function onAction(action: TLayerAction) {
    action.action();
    session.virtualScreen.redraw();
    logEvent('button_inspector_operations', action.title);
}

async function addImageToAssets() {
    logEvent('button_inspector_operations', 'Save');
    const imageLayer = props.activeLayer as AbstractImageLayer;
    const name = props.activeLayer.name ?? 'image_' + this.index + '.png';
    const img = await imageDataToImage(imageLayer.data);

    addCustomImage(name, imageLayer.data.width, imageLayer.data.height, img, true);
}
</script>

<template>
    <div class="flex flex-wrap mb-2 gap-2">
        <div
            class="font-lg"
            v-for="action in actions"
        >
            <Button
                v-if="!['Download', 'Save'].includes(action.label)"
                @click="onAction(action)"
                :title="action.title"
                isIcon
            >
                <Icon
                    v-if="action.iconType"
                    :type="action.iconType"
                />
                <template v-else>
                    {{ action.label }}
                </template>
            </Button>
            <Button
                v-else-if="action.label === 'Download'"
                @click="onAction(action)"
                :title="action.title"
            >
                {{ action.label }}
            </Button>
            <Button
                v-else-if="action.label === 'Save' && activeLayer.getType() === 'paint'"
                @click="addImageToAssets"
                :title="action.title"
            >
                {{ action.label }}
            </Button>
        </div>
    </div>
</template>
