<script lang="ts" setup>
import {defineProps} from 'vue';

const props = defineProps<{
    text: string;
    title?: string;
    active?: boolean;
}>();
</script>
<template>
    <button class="button" :class="{button_active: active}" :title="title">
        {{ text }}
    </button>
</template>
<style lang="css"></style>
