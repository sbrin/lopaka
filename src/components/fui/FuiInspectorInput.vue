<script lang="ts" setup>
import {numberFontsRegex, standardFontsRegex, textContainerHeight} from '../../const';
import {getTextWidth} from '../../utils';
import {computed, defineProps} from 'vue';

const props = defineProps<{
    element: any;
    type: string;
    field: string;
    library?: string;
    id?: string;
    disabled?: boolean;
}>();

const emit = defineEmits(['update']);

const hasNoWidth = computed(() => {
    return ['str', 'dot'].includes(props.element.type) && ['width', 'height'].includes(props.field);
});

const charsRegex = computed(() => {
    return props.element.font === 'profont22_tr' && props.library === 'flipper' ? numberFontsRegex : standardFontsRegex;
});

const fontsList = {
    flipper: ['helvB08_tr', 'haxrcorp4089_tr', 'profont22_tr'],
    u8g2: ['helvB08_tr', 'haxrcorp4089_tr', 'profont22_tr', 'f4x6_tr'],
    uint32: ['helvB08_tr', 'haxrcorp4089_tr', 'profont22_tr', 'f4x6_tr'],
    adafruit_gfx: ['adafruit']
};

function onInput(e) {
    if (['checkbox'].includes(props.type)) {
        props.element[props.field] = e.target.checked;
    } else {
        const result = ['text'].includes(props.type)
            ? e.target.value.replace(charsRegex.value, '')
            : parseInt(e.target.value.replace(/[^0-9\-]/g, ''));
        e.target.value = result;
        props.element[props.field] = result;
        if (['text'].includes(props.field)) {
            updateTextWidth();
        }
    }
    emit('update', props.element);
}

function onSelect(e) {
    props.element[props.field] = e.target.value;
    if (['font'].includes(props.field)) {
        props.element.text = props.element.text.replace(charsRegex.value, '').trim();
        updateTextWidth();
    }
    emit('update', props.element);
}

function updateTextWidth() {
    // recalculate text draggable area size
    props.element.width = getTextWidth(props.element.text, props.element.font);
    props.element.height = textContainerHeight[props.element.font];
    props.element.yy = props.element.y - textContainerHeight[props.element.font];
}
</script>
<template>
    <span v-if="hasNoWidth">{{ element[field] }}</span>
    <select class="input-select" v-if="field === 'font'" :value="element[field]" @input="onSelect" :id="id">
        <option v-for="(font, idx) in fontsList[library]" :key="idx" :value="font">
            {{ font }}
        </option>
    </select>
    <input
        v-else-if="type === 'checkbox'"
        class="inspector__input"
        @input="onInput"
        :type="type"
        :id="id"
        :checked="element[field]"
    />
    <input
        v-else
        class="inspector__input"
        @input="onInput"
        :value="element[field]"
        :type="type"
        :id="id"
        max="1024"
        min="-1024"
        step="1"
        :disabled="disabled"
    />
</template>
<style lang="css"></style>
