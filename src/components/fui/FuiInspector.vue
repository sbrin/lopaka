<script lang="ts" setup>
import {computed, toRefs} from 'vue';
import {useSession} from '../../core/session';
import {ToolParam, ToolParamType} from '../../draw/tools/tool';
import iconsUrls from '../../icons';
import {loadFont} from '../../draw/fonts';

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
            image.dataset.name = name;
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
            const font = session.platforms[platform.value]
                .getFonts()
                .find((f: TPlatformFont) => f.name === target.value);
            // lock scrteen while loading font
            session.lock();
            loadFont(font).then(() => {
                session.unlock();
                param.onChange(font.name);
            });
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
        <div class="inspector-panel">
            <div v-for="param in params" class="inspector-panel__param">
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
                        <option v-for="font in fonts" :value="font.name">{{ font.title }}</option>
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
.inspector-panel {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
}
.inspector-panel__param {
    flex: 0 0 calc(50% - 4px);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 8px;
    font-size: var(--input-font-size);
}
.inspector__title {
    overflow: hidden;
    width: 150px;
}

.inspector__input {
    background: var(--secondary-color);
    color: var(--primary-color);
    border: none;
    padding: 2px 0px 2px 4px;
    outline: none;
    width: 100%;
}

.selected {
    border: 1px dashed #01f9d8 !important;
}
</style>
