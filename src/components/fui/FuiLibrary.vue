<script lang="ts" setup>
import {LIBRARIES} from '../../const';
import {defineProps} from 'vue';

const props = defineProps<{
    library: string;
}>();

const emit = defineEmits(['selectLibrary']);

const libs = LIBRARIES;

function onSelect(e) {
    emit('selectLibrary', e.target.value);
}
</script>
<template>
    <div class="fui-select">
        <label for="library" class="fui-select__label">Library:</label>
        <select id="library" class="fui-select__select input-select" :value="library" @input="onSelect">
            <option v-for="(lib, idx) in Object.keys(libs)" :key="idx" :value="lib">
                {{ libs[lib] }}
            </option>
        </select>
    </div>
</template>
<style lang="css"></style>
