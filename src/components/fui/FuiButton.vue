<script lang="ts" setup>
import {defineProps} from 'vue';

const props = defineProps<{
    active?: boolean;
}>();
</script>
<template>
    <span class="button" :class="{button_active: active}">
        <slot></slot>
    </span>
</template>
<style lang="css"></style>
