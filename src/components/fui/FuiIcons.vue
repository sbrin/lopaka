<script lang="ts" setup>
import {computed, defineProps, toRefs} from 'vue';
import {useSession} from '../../core/session';
import {iconsList} from '../../icons/icons';

const props = defineProps<{
    isSandbox: boolean;
}>();

const session = useSession();
const {customImages} = toRefs(session.state);
const emit = defineEmits(['cleanCustomIcons', 'iconClicked']);

const customImagesSorted = computed(() => {
    return customImages.value.sort((a, b) => a.id - b.id);
});

function removeImage(image) {
    customImages.value = customImages.value.filter((img) => img.name !== image.name);
}

function iconClick(e, item) {
    const data = {
        name: item.name,
        width: item.width,
        height: item.height,
        icon: e.target,
    };
    emit('iconClicked', data);
}

function iconDragStart(e: DragEvent) {
    const target = e.target as HTMLImageElement;
    e.dataTransfer.dropEffect = 'move';
    e.dataTransfer.setData('text/plain', target.dataset.name);
    e.dataTransfer.setData('text/uri', target.src);
}
</script>
<template>
    <div class="fui-icons p-2">
        <div class="p-2 bg-neutral rounded rounded-md overflow-y-scroll h-full">
            <details
                open
                v-if="customImages.length"
            >
                <summary class="fui-icons-custom cursor-pointer pb-2 text-white">Current Project</summary>
                <div class="fui-iconset flex flex-row flex-wrap pb-4">
                    <div
                        class="relative image-custom"
                        v-for="(item, index) in customImagesSorted"
                        :key="index"
                    >
                        <img
                            @dragstart="iconDragStart"
                            @click="iconClick($event, item)"
                            draggable="true"
                            :key="index"
                            :src="item.image.src"
                            :data-name="item.name"
                            :width="item.width * 2"
                            :height="item.height * 2"
                            :data-w="item.width"
                            :data-h="item.height"
                            :alt="item.name"
                            :title="item.name"
                            crossorigin="anonymous"
                            class="object-contain p-4 box-content image-custom-inner max-h-16"
                        />
                        <div class="absolute -right-2 -top-2 hidden image-custom-remove">
                            <span
                                class="btn btn-circle btn-xs btn-round text-error"
                                @click="removeImage(item)"
                                title="Delete"
                            >
                                ×
                            </span>
                        </div>
                    </div>
                </div>
            </details>
            <details
                v-for="(value, key) in iconsList"
                class=""
                open
            >
                <summary class="cursor-pointer pb-2 text-white">{{ value.title }}</summary>
                <div class="fui-iconset flex flex-row flex-wrap">
                    <div
                        class=""
                        v-for="(item, index) in iconsList[key].icons"
                        :key="index"
                    >
                        <img
                            @dragstart="iconDragStart"
                            draggable="true"
                            @click="iconClick($event, item)"
                            :src="item.image"
                            :data-name="item.name"
                            :data-w="item.width"
                            :data-h="item.height"
                            :width="item.width * 2"
                            :height="item.height * 2"
                            :alt="item.name"
                            :title="item.name"
                            class="object-contain invert p-4 box-content hover:bg-gray-300"
                        />
                    </div>
                </div>
            </details>
        </div>
    </div>
</template>
<style lang="css">
.fui-icons {
    background: var(--primary-color);
    border: 2px solid var(--border-dark-color);
    border-radius: 0 10px 10px 10px;
    border-top: 0;
    margin: 0 0 8px 0;
    height: 350px;
}

.fui-iconset img {
    cursor: pointer;
    image-rendering: pixelated;
    display: block;
    max-width: 128px;
    /* height: auto; */
}

.image-custom:hover .image-custom-inner {
    background-color: oklch(var(--s));
}
.image-custom:hover .image-custom-remove {
    display: block;
}

.fui-icons-remove {
    display: none;
    cursor: pointer;
    color: var(--danger-color);
    margin: 0 8px;
}
</style>
