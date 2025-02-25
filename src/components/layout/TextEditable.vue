<script lang="ts" setup>
import {nextTick, ref} from 'vue';
import Icon from '/src/components/layout/Icon.vue';

const props = defineProps<{
    text: string;
    readonly?: boolean;
    class: string;
}>();
const emit = defineEmits(['update']);

const textInput = ref(null);
const isEditing = ref(false);
const newText = ref('');

function edit() {
    if (props.readonly) return;
    newText.value = props.text;
    isEditing.value = true;
    nextTick(() => {
        textInput.value.focus();
        textInput.value.select();
    });
}

async function save() {
    isEditing.value = false;
    if (props.text !== newText.value) {
        emit('update', newText.value);
    }
}
</script>
<template>
    <div
        :class="props.class"
        class="relative text-editable"
    >
        <input
            v-show="isEditing"
            ref="textInput"
            type="text"
            :class="props.class"
            class="input input-xs input-ghost max-w-full min-w-full"
            :style="{width: newText.length + 2 + 'ch'}"
            v-model="newText"
            @blur="save"
            @keydown.esc="isEditing = false"
            @keydown.enter="isEditing = false"
            :readonly="readonly"
        />
        <div
            v-show="!isEditing"
            class="truncate pr-4 min-h-6"
            style="white-space: pre"
            @click="edit"
        >
            {{ text || ' ' }}
        </div>
        <Icon
            v-show="!isEditing && !readonly"
            type="edit"
            sm
            class="text-editable__icon hidden absolute text-gray-500 right-0 bottom-[0.3em] pointer-events-none"
        />
    </div>
</template>
<style lang="css" scoped>
.text-editable:hover .text-editable__icon {
    display: inline-block;
}
.text-input {
    display: none;
}

.text:hover .text-input {
    display: inline-block;
}
</style>
