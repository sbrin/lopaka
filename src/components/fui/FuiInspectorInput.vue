<script lang="ts" setup>
import {useSession} from '../../core/session';
import {numberFontsRegex, standardFontsRegex, textCharHeight} from '../../const';
import {getTextWidth} from '../../utils';
import {computed, defineProps, toRefs} from 'vue';

const props = defineProps<{
    field: string;
    disabled?: boolean;
    type: string;
}>();
const {activeLayer, platform} = toRefs(useSession());

const emit = defineEmits(['update']);

const hasNoWidth = computed(() => {
    return ['str', 'dot'].includes(activeLayer.value.type) && ['width', 'height'].includes(props.field);
});

const charsRegex = computed(() => {
    return activeLayer.value?.data?.font === 'profont22_tr' && platform.value.getName() === 'Flipper zero'
        ? numberFontsRegex
        : standardFontsRegex;
});

// const fontsList = {
//     flipper: ['helvB08_tr', 'haxrcorp4089_tr', 'profont22_tr'],
//     u8g2: ['helvB08_tr', 'haxrcorp4089_tr', 'profont22_tr', 'f4x6_tr'],
//     uint32: ['helvB08_tr', 'haxrcorp4089_tr', 'profont22_tr', 'f4x6_tr'],
//     adafruit_gfx: ['adafruit']
// };

function onInput(e) {
    if (['checkbox'].includes(props.type)) {
        activeLayer.value[props.field] = e.target.checked;
    } else {
        const result = ['text'].includes(props.type)
            ? e.target.value.replace(charsRegex.value, '')
            : parseInt(e.target.value.replace(/[^0-9\-]/g, ''));
        e.target.value = result;
        activeLayer.value[props.field] = result;
        if (['text'].includes(props.field)) {
            updateTextWidth();
        }
    }
}

function onSelect(e) {
    activeLayer.value[props.field] = e.target.value;
    if (['font'].includes(props.field)) {
        activeLayer.value.data.text = activeLayer.value.data.text.replace(charsRegex.value, '').trim();
        updateTextWidth();
    }
}

function updateTextWidth() {
    // recalculate text draggable area size

    activeLayer.value.size.x = getTextWidth(activeLayer.value.data.text, activeLayer.value.data.font);
    activeLayer.value.size.y = textCharHeight[activeLayer.value.data.font];
    // todo
    // props.element.yy = props.element.y - textCharHeight[props.element.font];
}
</script>
<template>
    <span v-if="hasNoWidth">{{ activeLayer[field] }}</span>
    <select
        class="input-select"
        v-if="field === 'font'"
        :value="activeLayer[field]"
        @input="onSelect"
        :id="activeLayer.id"
    >
        <option v-for="(font, idx) in platform.getFonts()" :key="idx" :value="font.name">
            {{ font.name }}
        </option>
    </select>
    <input
        v-else-if="type === 'checkbox'"
        class="inspector__input"
        @input="onInput"
        :type="type"
        :id="activeLayer.id"
        :checked="activeLayer[field]"
    />
    <input
        v-else
        class="inspector__input"
        @input="onInput"
        :value="activeLayer[field]"
        :type="type"
        :id="activeLayer.id"
        max="1024"
        min="-1024"
        step="1"
        :disabled="disabled"
    />
</template>
<style lang="css"></style>
