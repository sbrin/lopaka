<script lang="ts" setup>
import {computed, defineProps} from 'vue';

const props = defineProps<{
    active?: boolean;
    filled?: boolean;
    danger?: boolean;
    success?: boolean;
    isIcon?: boolean;
}>();

const classNames = computed(() => ({
    'btn-outline': !props.active && !props.filled,
    'btn-error': props.danger,
    'btn-success': props.success,
    'btn-square text-2xl align-top': props.isIcon
}));
</script>
<template>
    <div class="btn btn-sm btn-primary font-sans uppercase leading-none" :class="classNames">
        <slot></slot>
    </div>
</template>
<style lang="css"></style>
