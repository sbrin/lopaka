<script lang="ts" setup>
import {defineProps} from 'vue';

const props = defineProps<{
    content: string;
}>();
</script>
<template>
    <div class="fui-code">
        <pre>{{ content }}</pre>
    </div>
</template>
<style lang="css"></style>
