<script lang="ts" setup>
import {ComputedRef, UnwrapRef, computed, toRefs} from 'vue';
import {AbstractLayer, TLayerModifier, TLayerModifiers, TModifierType} from '../../core/layers/abstract.layer';
import {useSession} from '../../core/session';
import {loadFont} from '../../draw/fonts';
const session = useSession();
const {platform} = toRefs(session.state);
const {updates} = toRefs(session.virtualScreen.state);

// const icons = computed(() => {
//     return Object.entries(iconsUrls)
//         .map((item) => {
//             const [name, file] = item;
//             const matchedSizeArr = name.match(/_([0-9]+)x([0-9]+)/i) ? name.match(/_([0-9]+)x([0-9]+)/i) : [0, 10, 10];
//             const [, width, height] = matchedSizeArr.map((num) => parseInt(num, 10));
//             const image = new Image(width, height);
//             image.crossOrigin = 'Anonymous';
//             image.dataset.name = name;
//             image.src = file;
//             return {
//                 name,
//                 width,
//                 height,
//                 image
//             };
//         })
//         .sort((a, b) => a.width * a.height - b.width * b.height);
// });

const activeLayer: ComputedRef<UnwrapRef<AbstractLayer>> = computed(() => {
    const selection = session.state.layers.filter((l) => l.selected);
    return updates.value && selection.length == 1 ? selection[0] : null;
});

const params: ComputedRef<UnwrapRef<TLayerModifiers>> = computed(() =>
    updates.value && activeLayer.value ? activeLayer.value.modifiers : {}
);

const fonts = computed(() => {
    return session.platforms[platform.value].getFonts();
});

function onChange(event: Event, param: TLayerModifier) {
    const target = event.target as HTMLInputElement;
    switch (param.type) {
        case TModifierType.number:
            param.setValue(parseFloat(target.value));
            break;
        case TModifierType.string:
        case TModifierType.color:
            param.setValue(target.value);
            break;
        case TModifierType.boolean:
            param.setValue(target.checked);
            break;
        case TModifierType.font:
            const font = session.platforms[platform.value]
                .getFonts()
                .find((f: TPlatformFont) => f.name === target.value);
            // lock scrteen while loading font
            session.lock();
            loadFont(font).then(() => {
                session.unlock();
                param.setValue(font.name);
                session.virtualScreen.redraw();
            });
            break;
        // case TModifierType.image:
        //     param.setValue(icons.value.find((image) => target.dataset.name === image.name).image);
        //     break;
    }
    session.virtualScreen.redraw();
}
</script>
<template>
    <div class="inspector" v-if="activeLayer">
        <datalist id="presetColors">
            <!-- 16 colors -->
            <option>#000000</option>
            <option>#0000AA</option>
            <option>#00AA00</option>
            <option>#00AAAA</option>
            <option>#AA0000</option>
            <option>#AA00AA</option>
            <option>#AA5500</option>
            <option>#AAAAAA</option>
            <option>#555555</option>
            <option>#5555FF</option>
            <option>#55FF55</option>
            <option>#55FFFF</option>
            <option>#FF5555</option>
            <option>#FF55FF</option>
            <option>#FFFF55</option>
            <option>#FFFFFF</option>
        </datalist>
        <div class="title inspector__title">{{ activeLayer.name }}</div>
        <div class="inspector-panel">
            <div v-for="(param, name) in params" class="inspector-panel__param">
                <span v-if="param.type !== TModifierType.image">{{ name }}</span>
                <div v-if="param.type == TModifierType.number">
                    <input
                        class="inspector__input"
                        type="number"
                        :value="param.getValue()"
                        @change="onChange($event, param)"
                    />
                </div>
                <div v-else-if="param.type == TModifierType.string">
                    <input
                        class="inspector__input"
                        type="text"
                        :value="param.getValue()"
                        @keyup="onChange($event, param)"
                    />
                </div>
                <div v-else-if="param.type == TModifierType.boolean">
                    <input
                        class="inspector__input"
                        type="checkbox"
                        :checked="param.getValue()"
                        @change="onChange($event, param)"
                    />
                </div>
                <div v-else-if="param.type == TModifierType.color">
                    <input
                        class="inspector__input"
                        type="color"
                        :value="param.getValue()"
                        @input="onChange($event, param)"
                        list="presetColors"
                    />
                </div>
                <div v-else-if="param.type == TModifierType.font">
                    <select class="inspector__input" :value="param.getValue()" @change="onChange($event, param)">
                        <option v-for="font in fonts" :value="font.name">{{ font.title }}</option>
                    </select>
                </div>
                <!-- <div v-else-if="param.type == TModifierType.image" class="fui-icons">
                    <img
                        @click="onChange($event, param)"
                        :class="{selected: (activeLayer as IconLayer).imageName === icon.name}"
                        v-for="icon in icons"
                        :src="icon.image.src"
                        :title="icon.name"
                        :alt="icon.name"
                        :data-name="icon.name"
                        :width="icon.width * scale.x"
                        :height="icon.height * scale.y"
                    />
                </div> -->
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

.inspector__input[type='color'] {
    height: 20px;
    padding: 0px;
    width: 60px;
}

.selected {
    border: 1px dashed #01f9d8 !important;
}
</style>
