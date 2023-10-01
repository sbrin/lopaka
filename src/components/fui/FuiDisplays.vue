<script lang="ts" setup>
import {displaySizes} from '../../const';
import {defineProps, onMounted} from 'vue';

const props = defineProps<{
    display: string;
}>();

const emit = defineEmits(['updateDisplay']);

const sizes = displaySizes;

onMounted(() => {
    emit('updateDisplay', props.display); //FIXME
});

function onSelect(e) {
    emit('updateDisplay', e.target.value);
}
</script>
<template>
    <div class="fui-displays fui-select">
        <label for="display-size" class="fui-select__label">Display:</label>
        <select id="display-size" class="fui-select__select input-select" :value="display" @input="onSelect">
            <option v-for="(item, idx) in sizes" :key="idx" :value="item">
                {{ item }}
            </option>
        </select>
    </div>
</template>
<style lang="css"></style>
