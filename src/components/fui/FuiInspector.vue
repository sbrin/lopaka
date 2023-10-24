<script lang="ts" setup>
import {computed, toRefs} from 'vue';
import {useSession} from '../../core/session';
import {ToolParam, ToolParamType} from '../../draw/tools/tool';
import iconsUrls from '../../icons';

const session = useSession();
const {platform, activeLayer, activeTool, scale} = toRefs(session.state);

const icons = computed(() => {
    return Object.entries(iconsUrls)
        .map((item) => {
            const [name, file] = item;
            const matchedSizeArr = name.match(/_([0-9]+)x([0-9]+)/i) ? name.match(/_([0-9]+)x([0-9]+)/i) : [0, 10, 10];
            const [, width, height] = matchedSizeArr.map((num) => parseInt(num, 10));
            const image = new Image(width, height);
            image.crossOrigin = 'Anonymous';
            image.src = file;
            return {
                name,
                width,
                height,
                image
            };
        })
        .sort((a, b) => a.width * a.height - b.width * b.height);
});

const params = computed(() => {
    return activeTool.value.getParams();
});

const fonts = computed(() => {
    return session.platforms[platform.value].getFonts();
});

function onChange(event: Event, param: ToolParam) {
    const target = event.target as HTMLInputElement;
    switch (param.type) {
        case ToolParamType.number:
            param.onChange(parseFloat(target.value));
            break;
        case ToolParamType.string:
            param.onChange(target.value);
            break;
        case ToolParamType.boolean:
            param.onChange(target.checked);
            break;
        case ToolParamType.font:
            param.onChange(target.value);
            break;
        case ToolParamType.image:
            param.onChange(icons.value.find((image) => target.dataset.name === image.name).image);
            break;
    }
}
</script>
<template>
    <div class="inspector" v-if="activeLayer">
        <div class="title inspector__title">{{ activeLayer.name || activeLayer.type }}</div>
        <div class="inspector__row">
            <div v-for="param in params">
                <span>{{ param.name }}</span>
                <div v-if="param.type == ToolParamType.number">
                    <input
                        class="inspector__input"
                        type="number"
                        :value="param.value"
                        @change="onChange($event, param)"
                    />
                </div>
                <div v-else-if="param.type == ToolParamType.string">
                    <input class="inspector__input" type="text" :value="param.value" @keyup="onChange($event, param)" />
                </div>
                <div v-else-if="param.type == ToolParamType.boolean">
                    <input
                        class="inspector__input"
                        type="checkbox"
                        :checked="param.value"
                        @change="onChange($event, param)"
                    />
                </div>
                <div v-else-if="param.type == ToolParamType.font">
                    <select class="inspector__input" :value="param.value" @change="onChange($event, param)">
                        <option v-for="font in fonts" :value="font.name">{{ font.name }}</option>
                    </select>
                </div>
                <div v-else-if="param.type == ToolParamType.image" class="fui-icons">
                    <img
                        @click="onChange($event, param)"
                        :class="{selected: activeLayer.data.name === icon.name}"
                        v-for="icon in icons"
                        :src="icon.image.src"
                        :title="icon.name"
                        :alt="icon.name"
                        :data-name="icon.name"
                        :width="icon.width * scale.x"
                        :height="icon.height * scale.y"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
<style lang="css">
.selected {
    border: 1px solid #00f;
}
</style>
